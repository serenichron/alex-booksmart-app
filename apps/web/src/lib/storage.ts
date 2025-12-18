// Supabase storage utilities for bookmarks
import { supabase } from './supabase'

export interface Note {
  id: string
  content: string
  created_at: string
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  created_at: string
}

export interface Bookmark {
  id: string
  title: string
  summary: string
  url: string | null
  type: 'link' | 'image' | 'text' | 'todo' | 'document' | 'video' | 'other'
  created_at: string
  updated_at: string
  is_favorite: boolean
  categories: string[]
  tags: string[]
  image_url: string | null
  meta_description: string | null
  show_meta_description?: boolean
  notes: Note[]
  todo_items?: TodoItem[]
}

export interface Board {
  id: string
  name: string
  bookmarks: Bookmark[]
  created_at: string
  updated_at: string
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  return user.id
}

// Board Management
export async function getBoards(): Promise<Board[]> {
  const userId = await getCurrentUserId()

  const { data: boards, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error

  // For each board, fetch its bookmarks
  const boardsWithBookmarks = await Promise.all(
    (boards || []).map(async (board) => {
      const bookmarks = await getBookmarksByBoardId(board.id)
      return {
        ...board,
        bookmarks
      }
    })
  )

  // If no boards exist, create a default one
  if (boardsWithBookmarks.length === 0) {
    const defaultBoard = await createBoard('My Board')
    return [defaultBoard]
  }

  return boardsWithBookmarks
}

// Helper function to get bookmarks for a specific board
async function getBookmarksByBoardId(boardId: string): Promise<Bookmark[]> {
  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // For each bookmark, fetch its notes and todo items
  const bookmarksWithDetails = await Promise.all(
    (bookmarks || []).map(async (bookmark) => {
      // Fetch notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('bookmark_id', bookmark.id)
        .order('created_at', { ascending: false })

      // Fetch todo items
      const { data: todoItems } = await supabase
        .from('todo_items')
        .select('*')
        .eq('bookmark_id', bookmark.id)
        .order('created_at', { ascending: true })

      return {
        ...bookmark,
        notes: notes || [],
        todo_items: todoItems || []
      }
    })
  )

  return bookmarksWithDetails
}

// Current board ID management (stored in localStorage for now)
const CURRENT_BOARD_KEY = 'booksmart_current_board'

export function getCurrentBoardId(): string | null {
  return localStorage.getItem(CURRENT_BOARD_KEY)
}

export function setCurrentBoardId(boardId: string): void {
  localStorage.setItem(CURRENT_BOARD_KEY, boardId)
}

export async function getCurrentBoard(): Promise<Board | null> {
  const boards = await getBoards()
  const currentId = getCurrentBoardId()
  return boards.find(b => b.id === currentId) || boards[0] || null
}

export async function createBoard(name: string): Promise<Board> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('boards')
    .insert([{ name, user_id: userId }])
    .select()
    .single()

  if (error) throw error

  return {
    ...data,
    bookmarks: []
  }
}

export async function renameBoard(boardId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ name: newName })
    .eq('id', boardId)

  if (error) throw error
}

export async function deleteBoard(boardId: string): Promise<void> {
  const boards = await getBoards()

  // Don't allow deleting the last board
  if (boards.length <= 1) return

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)

  if (error) throw error

  // If we deleted the current board, switch to the first remaining board
  if (getCurrentBoardId() === boardId) {
    const remainingBoards = boards.filter(b => b.id !== boardId)
    if (remainingBoards.length > 0) {
      setCurrentBoardId(remainingBoards[0].id)
    }
  }
}

// Get all bookmarks from all boards (for global search)
export async function getAllBookmarksWithBoard(): Promise<Array<Bookmark & { boardId: string; boardName: string }>> {
  const boards = await getBoards()
  const allBookmarks: Array<Bookmark & { boardId: string; boardName: string }> = []

  boards.forEach(board => {
    board.bookmarks.forEach(bookmark => {
      allBookmarks.push({
        ...bookmark,
        boardId: board.id,
        boardName: board.name
      })
    })
  })

  return allBookmarks
}

// Bookmarks - Now operates on current board
export async function getBookmarks(): Promise<Bookmark[]> {
  const board = await getCurrentBoard()
  return board ? board.bookmarks : []
}

export async function saveBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>): Promise<Bookmark> {
  const userId = await getCurrentUserId()
  const currentBoardId = getCurrentBoardId()

  if (!currentBoardId) throw new Error('No current board selected')

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([{
      title: bookmark.title,
      summary: bookmark.summary,
      url: bookmark.url,
      type: bookmark.type,
      is_favorite: bookmark.is_favorite,
      categories: bookmark.categories,
      tags: bookmark.tags,
      image_url: bookmark.image_url,
      meta_description: bookmark.meta_description,
      show_meta_description: bookmark.show_meta_description,
      user_id: userId,
      board_id: currentBoardId
    }])
    .select()
    .single()

  if (error) throw error

  // If there are notes or todo_items in the bookmark object, save them
  const newBookmark: Bookmark = {
    ...data,
    notes: [],
    todo_items: []
  }

  // Save notes if provided
  if (bookmark.notes && bookmark.notes.length > 0) {
    for (const note of bookmark.notes) {
      await addNoteToBookmark(newBookmark.id, note.content)
    }
    newBookmark.notes = bookmark.notes
  }

  // Save todo items if provided
  if (bookmark.todo_items && bookmark.todo_items.length > 0) {
    for (const todo of bookmark.todo_items) {
      await addTodoItem(newBookmark.id, todo.text)
    }
    newBookmark.todo_items = bookmark.todo_items
  }

  return newBookmark
}

export async function deleteBookmark(id: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateBookmark(id: string, updates: Partial<Bookmark>): Promise<void> {
  // Extract only the fields that exist in the bookmarks table
  const { notes, todo_items, ...bookmarkUpdates } = updates

  const { error } = await supabase
    .from('bookmarks')
    .update(bookmarkUpdates)
    .eq('id', id)

  if (error) throw error
}

// Note management
export async function addNoteToBookmark(bookmarkId: string, content: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert([{ bookmark_id: bookmarkId, content }])
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteNoteFromBookmark(bookmarkId: string, noteId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('bookmark_id', bookmarkId)

  if (error) throw error
}

export async function updateNoteInBookmark(bookmarkId: string, noteId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', noteId)
    .eq('bookmark_id', bookmarkId)

  if (error) throw error
}

// Todo items management
export async function toggleTodoItem(bookmarkId: string, todoId: string): Promise<void> {
  // First get the current todo item
  const { data: todoItem, error: fetchError } = await supabase
    .from('todo_items')
    .select('completed')
    .eq('id', todoId)
    .eq('bookmark_id', bookmarkId)
    .single()

  if (fetchError) throw fetchError

  // Toggle the completed state
  const { error } = await supabase
    .from('todo_items')
    .update({ completed: !todoItem.completed })
    .eq('id', todoId)
    .eq('bookmark_id', bookmarkId)

  if (error) throw error
}

export async function addTodoItem(bookmarkId: string, text: string): Promise<TodoItem> {
  const { data, error } = await supabase
    .from('todo_items')
    .insert([{ bookmark_id: bookmarkId, text, completed: false }])
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteTodoItem(bookmarkId: string, todoId: string): Promise<void> {
  const { error } = await supabase
    .from('todo_items')
    .delete()
    .eq('id', todoId)
    .eq('bookmark_id', bookmarkId)

  if (error) throw error
}

export async function updateTodoItem(bookmarkId: string, todoId: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('todo_items')
    .update({ text })
    .eq('id', todoId)
    .eq('bookmark_id', bookmarkId)

  if (error) throw error
}

// Categories - Extract from all bookmarks
export async function getCategories(): Promise<string[]> {
  const bookmarks = await getBookmarks()
  const categoriesSet = new Set<string>()

  bookmarks.forEach(bookmark => {
    bookmark.categories.forEach(cat => categoriesSet.add(cat))
  })

  return Array.from(categoriesSet).sort()
}

export async function addCategory(category: string): Promise<void> {
  // Categories are stored as arrays in bookmarks, no separate storage needed
  // This function is kept for compatibility but doesn't need to do anything
}

// Tags - Extract from all bookmarks
export async function getTags(): Promise<string[]> {
  const bookmarks = await getBookmarks()
  const tagsSet = new Set<string>()

  bookmarks.forEach(bookmark => {
    bookmark.tags.forEach(tag => tagsSet.add(tag))
  })

  return Array.from(tagsSet).sort()
}

export async function addTag(tag: string): Promise<void> {
  // Tags are stored as arrays in bookmarks, no separate storage needed
  // This function is kept for compatibility but doesn't need to do anything
}

// Stats
export async function getStats() {
  const bookmarks = await getBookmarks()
  const categories = await getCategories()
  const tags = await getTags()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeek = bookmarks.filter(b => new Date(b.created_at) >= weekAgo).length

  return {
    total: bookmarks.length,
    categories: categories.length,
    tags: tags.length,
    thisWeek,
  }
}

// Export/Import/Clear functions
export interface ExportData {
  boards: Board[]
  currentBoardId: string | null
  categories: string[]
  tags: string[]
  exportedAt: string
  version: string
}

export async function exportAllData(): Promise<ExportData> {
  return {
    boards: await getBoards(),
    currentBoardId: getCurrentBoardId(),
    categories: await getCategories(),
    tags: await getTags(),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
}

export async function importAllData(data: ExportData): Promise<void> {
  // Validate data structure
  if (!data.boards || !Array.isArray(data.boards)) {
    throw new Error('Invalid export data: missing boards array')
  }

  const userId = await getCurrentUserId()

  // Import each board
  for (const board of data.boards) {
    // Create the board
    const { data: newBoard, error: boardError } = await supabase
      .from('boards')
      .insert([{ name: board.name, user_id: userId }])
      .select()
      .single()

    if (boardError) throw boardError

    // Import bookmarks for this board
    for (const bookmark of board.bookmarks) {
      // Create bookmark
      const { data: newBookmark, error: bookmarkError } = await supabase
        .from('bookmarks')
        .insert([{
          title: bookmark.title,
          summary: bookmark.summary,
          url: bookmark.url,
          type: bookmark.type,
          is_favorite: bookmark.is_favorite,
          categories: bookmark.categories,
          tags: bookmark.tags,
          image_url: bookmark.image_url,
          meta_description: bookmark.meta_description,
          show_meta_description: bookmark.show_meta_description,
          user_id: userId,
          board_id: newBoard.id
        }])
        .select()
        .single()

      if (bookmarkError) throw bookmarkError

      // Import notes
      if (bookmark.notes && bookmark.notes.length > 0) {
        const notesToInsert = bookmark.notes.map(note => ({
          bookmark_id: newBookmark.id,
          content: note.content
        }))

        const { error: notesError } = await supabase
          .from('notes')
          .insert(notesToInsert)

        if (notesError) throw notesError
      }

      // Import todo items
      if (bookmark.todo_items && bookmark.todo_items.length > 0) {
        const todosToInsert = bookmark.todo_items.map(todo => ({
          bookmark_id: newBookmark.id,
          text: todo.text,
          completed: todo.completed
        }))

        const { error: todosError } = await supabase
          .from('todo_items')
          .insert(todosToInsert)

        if (todosError) throw todosError
      }
    }

    // Set the first imported board as current if no current board is set
    if (!getCurrentBoardId() && newBoard) {
      setCurrentBoardId(newBoard.id)
    }
  }
}

export async function clearAllData(): Promise<void> {
  const userId = await getCurrentUserId()

  // Delete all boards (cascades to bookmarks, notes, and todos)
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('user_id', userId)

  if (error) throw error

  // Clear current board from localStorage
  localStorage.removeItem(CURRENT_BOARD_KEY)
}
