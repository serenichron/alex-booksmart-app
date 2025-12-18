// Local storage utilities for bookmarks

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

const STORAGE_KEY = 'booksmart_bookmarks' // Legacy key for migration
const BOARDS_KEY = 'booksmart_boards'
const CURRENT_BOARD_KEY = 'booksmart_current_board'
const CATEGORIES_KEY = 'booksmart_categories'
const TAGS_KEY = 'booksmart_tags'

// Migrate old bookmarks to new format
function migrateBookmark(bookmark: any): Bookmark {
  // If notes is a string, convert to array
  if (typeof bookmark.notes === 'string') {
    const notes = bookmark.notes.trim()
      ? [{
          id: crypto.randomUUID(),
          content: bookmark.notes,
          created_at: bookmark.created_at
        }]
      : []
    bookmark.notes = notes
  }

  // Add updated_at if missing
  if (!bookmark.updated_at) {
    bookmark.updated_at = bookmark.created_at
  }

  // Add show_meta_description default if missing
  if (bookmark.show_meta_description === undefined) {
    bookmark.show_meta_description = true
  }

  return bookmark as Bookmark
}

// Board Migration - Convert old bookmark storage to board-based structure
function migrateToBoards(): void {
  const boardsData = localStorage.getItem(BOARDS_KEY)

  // If boards already exist, no migration needed
  if (boardsData) return

  // Check for old bookmarks
  const oldBookmarksData = localStorage.getItem(STORAGE_KEY)
  const oldBookmarks = oldBookmarksData ? JSON.parse(oldBookmarksData).map(migrateBookmark) : []

  // Create default board with existing bookmarks
  const now = new Date().toISOString()
  const defaultBoard: Board = {
    id: crypto.randomUUID(),
    name: 'My Board',
    bookmarks: oldBookmarks,
    created_at: now,
    updated_at: now
  }

  // Save boards and set current board
  localStorage.setItem(BOARDS_KEY, JSON.stringify([defaultBoard]))
  localStorage.setItem(CURRENT_BOARD_KEY, defaultBoard.id)

  // Remove old storage key
  localStorage.removeItem(STORAGE_KEY)
}

// Board Management
export function getBoards(): Board[] {
  migrateToBoards()
  const data = localStorage.getItem(BOARDS_KEY)
  return data ? JSON.parse(data) : []
}

function saveBoards(boards: Board[]): void {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards))
}

export function getCurrentBoardId(): string | null {
  migrateToBoards()
  return localStorage.getItem(CURRENT_BOARD_KEY)
}

export function setCurrentBoardId(boardId: string): void {
  localStorage.setItem(CURRENT_BOARD_KEY, boardId)
}

export function getCurrentBoard(): Board | null {
  const boards = getBoards()
  const currentId = getCurrentBoardId()
  return boards.find(b => b.id === currentId) || boards[0] || null
}

export function createBoard(name: string): Board {
  const boards = getBoards()
  const now = new Date().toISOString()
  const newBoard: Board = {
    id: crypto.randomUUID(),
    name,
    bookmarks: [],
    created_at: now,
    updated_at: now
  }
  boards.push(newBoard)
  saveBoards(boards)
  return newBoard
}

export function renameBoard(boardId: string, newName: string): void {
  const boards = getBoards()
  const board = boards.find(b => b.id === boardId)
  if (board) {
    board.name = newName
    board.updated_at = new Date().toISOString()
    saveBoards(boards)
  }
}

export function deleteBoard(boardId: string): void {
  let boards = getBoards()

  // Don't allow deleting the last board
  if (boards.length <= 1) return

  boards = boards.filter(b => b.id !== boardId)
  saveBoards(boards)

  // If we deleted the current board, switch to the first board
  if (getCurrentBoardId() === boardId) {
    setCurrentBoardId(boards[0].id)
  }
}

// Get all bookmarks from all boards (for global search)
export function getAllBookmarksWithBoard(): Array<Bookmark & { boardId: string; boardName: string }> {
  const boards = getBoards()
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
export function getBookmarks(): Bookmark[] {
  const board = getCurrentBoard()
  return board ? board.bookmarks : []
}

export function saveBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>): Bookmark {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (!board) throw new Error('No current board found')

  const now = new Date().toISOString()
  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  }

  board.bookmarks.unshift(newBookmark)
  board.updated_at = now
  saveBoards(boards)

  return newBookmark
}

export function deleteBookmark(id: string): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (!board) return

  board.bookmarks = board.bookmarks.filter(b => b.id !== id)
  board.updated_at = new Date().toISOString()
  saveBoards(boards)
}

export function updateBookmark(id: string, updates: Partial<Bookmark>): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (!board) return

  const index = board.bookmarks.findIndex(b => b.id === id)
  if (index !== -1) {
    board.bookmarks[index] = {
      ...board.bookmarks[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    board.updated_at = new Date().toISOString()
    saveBoards(boards)
  }
}

// Note management
export function addNoteToBookmark(bookmarkId: string, content: string): Note {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  const note: Note = {
    id: crypto.randomUUID(),
    content,
    created_at: new Date().toISOString()
  }

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark) {
      bookmark.notes.unshift(note) // Add to beginning (newest first)
      bookmark.updated_at = new Date().toISOString()
      board.updated_at = new Date().toISOString()
      saveBoards(boards)
    }
  }

  return note
}

export function deleteNoteFromBookmark(bookmarkId: string, noteId: string): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark) {
      bookmark.notes = bookmark.notes.filter(n => n.id !== noteId)
      bookmark.updated_at = new Date().toISOString()
      board.updated_at = new Date().toISOString()
      saveBoards(boards)
    }
  }
}

export function updateNoteInBookmark(bookmarkId: string, noteId: string, content: string): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark) {
      const note = bookmark.notes.find(n => n.id === noteId)
      if (note) {
        note.content = content
        bookmark.updated_at = new Date().toISOString()
        board.updated_at = new Date().toISOString()
        saveBoards(boards)
      }
    }
  }
}

// Todo items management
export function toggleTodoItem(bookmarkId: string, todoId: string): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark && bookmark.todo_items) {
      const todoItem = bookmark.todo_items.find(t => t.id === todoId)
      if (todoItem) {
        todoItem.completed = !todoItem.completed
        bookmark.updated_at = new Date().toISOString()
        board.updated_at = new Date().toISOString()
        saveBoards(boards)
      }
    }
  }
}

export function addTodoItem(bookmarkId: string, text: string): TodoItem {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  const todoItem: TodoItem = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    created_at: new Date().toISOString()
  }

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark) {
      if (!bookmark.todo_items) {
        bookmark.todo_items = []
      }
      bookmark.todo_items.push(todoItem)
      bookmark.updated_at = new Date().toISOString()
      board.updated_at = new Date().toISOString()
      saveBoards(boards)
    }
  }

  return todoItem
}

export function deleteTodoItem(bookmarkId: string, todoId: string): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark && bookmark.todo_items) {
      bookmark.todo_items = bookmark.todo_items.filter(t => t.id !== todoId)
      bookmark.updated_at = new Date().toISOString()
      board.updated_at = new Date().toISOString()
      saveBoards(boards)
    }
  }
}

export function updateTodoItem(bookmarkId: string, todoId: string, text: string): void {
  const boards = getBoards()
  const currentBoardId = getCurrentBoardId()
  const board = boards.find(b => b.id === currentBoardId)

  if (board) {
    const bookmark = board.bookmarks.find(b => b.id === bookmarkId)
    if (bookmark && bookmark.todo_items) {
      const todoItem = bookmark.todo_items.find(t => t.id === todoId)
      if (todoItem) {
        todoItem.text = text
        bookmark.updated_at = new Date().toISOString()
        board.updated_at = new Date().toISOString()
        saveBoards(boards)
      }
    }
  }
}

// Categories
export function getCategories(): string[] {
  const data = localStorage.getItem(CATEGORIES_KEY)
  return data ? JSON.parse(data) : []
}

export function addCategory(category: string): void {
  const categories = getCategories()
  if (!categories.includes(category)) {
    categories.push(category)
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }
}

// Tags
export function getTags(): string[] {
  const data = localStorage.getItem(TAGS_KEY)
  return data ? JSON.parse(data) : []
}

export function addTag(tag: string): void {
  const tags = getTags()
  if (!tags.includes(tag)) {
    tags.push(tag)
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags))
  }
}

// Stats
export function getStats() {
  const bookmarks = getBookmarks()
  const categories = getCategories()
  const tags = getTags()

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
