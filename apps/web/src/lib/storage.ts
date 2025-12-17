// Local storage utilities for bookmarks

export interface Note {
  id: string
  content: string
  created_at: string
}

export interface Bookmark {
  id: string
  title: string
  summary: string
  url: string | null
  type: 'link' | 'image' | 'text' | 'document' | 'video' | 'other'
  created_at: string
  updated_at: string
  is_favorite: boolean
  categories: string[]
  tags: string[]
  image_url: string | null
  meta_description: string | null
  show_meta_description?: boolean
  notes: Note[]
}

const STORAGE_KEY = 'booksmart_bookmarks'
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

// Bookmarks
export function getBookmarks(): Bookmark[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []

  const bookmarks = JSON.parse(data)
  // Migrate any old format bookmarks
  const migrated = bookmarks.map(migrateBookmark)

  // Save migrated data back if needed
  if (bookmarks.some((b: any) => typeof b.notes === 'string' || !b.updated_at || b.show_meta_description === undefined)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
  }

  return migrated
}

export function saveBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>): Bookmark {
  const bookmarks = getBookmarks()
  const now = new Date().toISOString()
  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  }
  bookmarks.unshift(newBookmark)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  return newBookmark
}

export function deleteBookmark(id: string): void {
  const bookmarks = getBookmarks().filter(b => b.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

export function updateBookmark(id: string, updates: Partial<Bookmark>): void {
  const bookmarks = getBookmarks()
  const index = bookmarks.findIndex(b => b.id === id)
  if (index !== -1) {
    bookmarks[index] = {
      ...bookmarks[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }
}

// Note management
export function addNoteToBookmark(bookmarkId: string, content: string): Note {
  const note: Note = {
    id: crypto.randomUUID(),
    content,
    created_at: new Date().toISOString()
  }

  const bookmarks = getBookmarks()
  const bookmark = bookmarks.find(b => b.id === bookmarkId)
  if (bookmark) {
    bookmark.notes.unshift(note) // Add to beginning (newest first)
    bookmark.updated_at = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }

  return note
}

export function deleteNoteFromBookmark(bookmarkId: string, noteId: string): void {
  const bookmarks = getBookmarks()
  const bookmark = bookmarks.find(b => b.id === bookmarkId)
  if (bookmark) {
    bookmark.notes = bookmark.notes.filter(n => n.id !== noteId)
    bookmark.updated_at = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }
}

export function updateNoteInBookmark(bookmarkId: string, noteId: string, content: string): void {
  const bookmarks = getBookmarks()
  const bookmark = bookmarks.find(b => b.id === bookmarkId)
  if (bookmark) {
    const note = bookmark.notes.find(n => n.id === noteId)
    if (note) {
      note.content = content
      bookmark.updated_at = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
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
