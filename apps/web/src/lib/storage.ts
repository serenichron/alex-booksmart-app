// Local storage utilities for bookmarks

export interface Bookmark {
  id: string
  title: string
  summary: string
  url: string | null
  type: 'link' | 'image' | 'text' | 'document' | 'video' | 'other'
  created_at: string
  is_favorite: boolean
  categories: string[]
  tags: string[]
}

const STORAGE_KEY = 'booksmart_bookmarks'
const CATEGORIES_KEY = 'booksmart_categories'
const TAGS_KEY = 'booksmart_tags'

// Bookmarks
export function getBookmarks(): Bookmark[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at'>): Bookmark {
  const bookmarks = getBookmarks()
  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
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
    bookmarks[index] = { ...bookmarks[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
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
