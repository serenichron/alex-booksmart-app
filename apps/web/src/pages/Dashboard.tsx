import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { AddBookmarkDialog } from '@/components/AddBookmarkDialog'
import { EditBookmarkDialog } from '@/components/EditBookmarkDialog'
import { NoteDialog } from '@/components/NoteDialog'
import { Bookmark, Plus, Search, Sparkles, ExternalLink, Heart, Clock, Trash2, Pencil, Share2, Link as LinkIcon, FileText, Image as ImageIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { getBookmarks, getStats, deleteBookmark, type Bookmark as BookmarkType, type Note } from '@/lib/storage'

interface BookmarkWithDetails extends BookmarkType {}

type BookmarkTypeFilter = 'text' | 'link' | 'image'

export function Dashboard() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedNoteBookmarkId, setSelectedNoteBookmarkId] = useState<string>('')
  const [expandedNotesBookmarks, setExpandedNotesBookmarks] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<BookmarkWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    tags: 0,
    thisWeek: 0,
  })
  const [selectedTypes, setSelectedTypes] = useState<Set<BookmarkTypeFilter>>(new Set(['text', 'link', 'image']))
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)

  const fetchBookmarks = () => {
    try {
      const bookmarksData = getBookmarks()
      setBookmarks(bookmarksData)
      setStats(getStats())
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group bookmarks by category
  const groupedByCategory = () => {
    const uncategorized = filteredBookmarks.filter(b => b.categories.length === 0)
    const categorizedMap = new Map<string, BookmarkWithDetails[]>()

    filteredBookmarks.forEach(bookmark => {
      bookmark.categories.forEach(category => {
        if (!categorizedMap.has(category)) {
          categorizedMap.set(category, [])
        }
        categorizedMap.get(category)!.push(bookmark)
      })
    })

    // Sort categories alphabetically
    const sortedCategories = Array.from(categorizedMap.keys()).sort()

    return { uncategorized, categorizedMap, sortedCategories }
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this bookmark?')) {
      deleteBookmark(id)
      fetchBookmarks()
    }
  }

  const handleEdit = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark)
    setShowEditDialog(true)
  }

  const handleShare = async (bookmark: BookmarkType) => {
    if (!bookmark.url) {
      alert('This bookmark does not have a URL to share')
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: bookmark.title,
          url: bookmark.url
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(bookmark.url)
        alert('URL copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const handleNoteClick = (note: Note, bookmarkId: string) => {
    setSelectedNote(note)
    setSelectedNoteBookmarkId(bookmarkId)
    setShowNoteDialog(true)
  }

  const handleToggleOlderNotes = (bookmarkId: string) => {
    setExpandedNotesBookmarks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId)
      } else {
        newSet.add(bookmarkId)
      }
      return newSet
    })
  }

  const handleToggleType = (type: BookmarkTypeFilter) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  const handleSelectAllTypes = () => {
    setSelectedTypes(new Set(['text', 'link', 'image']))
  }

  const handleUnselectAllTypes = () => {
    setSelectedTypes(new Set())
  }

  // Search function with priority: URL > Title > Meta Description > Notes > Categories > Tags > Summary
  const searchBookmarks = (bookmarks: BookmarkWithDetails[], query: string): BookmarkWithDetails[] => {
    if (!query.trim()) return bookmarks

    const lowerQuery = query.toLowerCase().trim()

    // Create a map to store bookmarks with their search priority
    const bookmarkPriority = new Map<string, { bookmark: BookmarkWithDetails; priority: number }>()

    bookmarks.forEach(bookmark => {
      let priority = 0

      // Priority 1: URL match (highest)
      if (bookmark.url && bookmark.url.toLowerCase().includes(lowerQuery)) {
        priority = 1
      }
      // Priority 2: Title match
      else if (bookmark.title && bookmark.title.toLowerCase().includes(lowerQuery)) {
        priority = 2
      }
      // Priority 3: Meta description match
      else if (bookmark.meta_description && bookmark.meta_description.toLowerCase().includes(lowerQuery)) {
        priority = 3
      }
      // Priority 4: Notes match
      else if (bookmark.notes.some(note => note.content.toLowerCase().includes(lowerQuery))) {
        priority = 4
      }
      // Priority 5: Categories match
      else if (bookmark.categories.some(cat => cat.toLowerCase().includes(lowerQuery))) {
        priority = 5
      }
      // Priority 6: Tags match
      else if (bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        priority = 6
      }
      // Priority 7: Summary/text content match
      else if (bookmark.summary && bookmark.summary.toLowerCase().includes(lowerQuery)) {
        priority = 7
      }

      // Only include bookmarks that match the search
      if (priority > 0) {
        bookmarkPriority.set(bookmark.id, { bookmark, priority })
      }
    })

    // Sort by priority (lower number = higher priority)
    return Array.from(bookmarkPriority.values())
      .sort((a, b) => a.priority - b.priority)
      .map(item => item.bookmark)
  }

  // Filter bookmarks based on selected types and search query
  const filteredBookmarks = (() => {
    // First filter by type
    let filtered = bookmarks.filter(bookmark => {
      if (selectedTypes.size === 0) return false
      return selectedTypes.has(bookmark.type as BookmarkTypeFilter)
    })

    // Then apply search
    if (searchQuery.trim()) {
      filtered = searchBookmarks(filtered, searchQuery)
    }

    return filtered
  })()

  useEffect(() => {
    fetchBookmarks()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Full Width */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                <Bookmark className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gray-900">BookSmart</span>
            </div>

            <div className="flex items-center gap-4">
              {showSearchInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search bookmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchInput(false)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowSearchInput(true)}>
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              )}
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4" />
                Add Bookmark
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Fixed Position */}
      <aside className="fixed left-0 top-16 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] p-4 overflow-y-auto z-40">
        <div className="space-y-6">
          {/* Bookmark Type Filter */}
          <div className="filter-section">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Bookmark Types</h3>
            </div>

            <div className="space-y-2 mb-3">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <Checkbox
                  checked={selectedTypes.has('link')}
                  onCheckedChange={() => handleToggleType('link')}
                />
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Links</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <Checkbox
                  checked={selectedTypes.has('text')}
                  onCheckedChange={() => handleToggleType('text')}
                />
                <FileText className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-700">Text</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <Checkbox
                  checked={selectedTypes.has('image')}
                  onCheckedChange={() => handleToggleType('image')}
                />
                <ImageIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Images</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllTypes}
                className="flex-1 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnselectAllTypes}
                className="flex-1 text-xs"
              >
                Unselect All
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - With left margin for sidebar */}
      <main className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stats-card bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-between">
            <div className="text-sm text-blue-100">Total Bookmarks</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-between">
            <div className="text-sm text-purple-100">Categories</div>
            <div className="text-3xl font-bold text-white">{stats.categories}</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-between">
            <div className="text-sm text-pink-100">Tags</div>
            <div className="text-3xl font-bold text-white">{stats.tags}</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-between">
            <div className="text-sm text-indigo-100">This Week</div>
            <div className="text-3xl font-bold text-white">{stats.thisWeek}</div>
          </div>
        </div>

        {/* Bookmarks */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Start Your Collection
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Save your first bookmark and organize it with categories and tags
            </p>
            <Button size="lg" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-5 h-5" />
              Add Your First Bookmark
            </Button>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          /* No results for current filter or search */
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              {searchQuery ? <Search className="w-8 h-8 text-gray-400" /> : <Filter className="w-8 h-8 text-gray-400" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Bookmarks Found
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `No bookmarks match "${searchQuery}". Try a different search term.`
                : "No bookmarks match the selected filters. Try selecting different bookmark types."
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          /* Bookmarks Organized by Category */
          <div className="bookmarks-by-category space-y-10">
            {(() => {
              const { uncategorized, categorizedMap, sortedCategories } = groupedByCategory()

              const renderBookmarkCard = (bookmark: BookmarkWithDetails) => {
                const isTextBookmark = !bookmark.url
                const isImageBookmark = bookmark.type === 'image'
                return (
                <div
                  key={bookmark.id}
                  className={`bookmark-card rounded-lg border overflow-hidden hover:shadow-lg hover:scale-[1.01] transition-all duration-200 break-inside-avoid mb-4 relative group ${
                    isTextBookmark
                      ? 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 border-yellow-300 shadow-sm'
                      : isImageBookmark
                      ? 'bg-black border-gray-800'
                      : 'bg-white border-gray-200/60 shadow-sm'
                  }`}
                >
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bookmark.url && (
                      <button
                        onClick={() => handleShare(bookmark)}
                        className="bg-slate-600/90 hover:bg-slate-700 text-white p-1.5 rounded-md shadow-md"
                        title="Share bookmark"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(bookmark)}
                      className="bg-slate-600/90 hover:bg-slate-700 text-white p-1.5 rounded-md shadow-md"
                      title="Edit bookmark"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="bg-rose-500/90 hover:bg-rose-600 text-white p-1.5 rounded-md shadow-md"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image Bookmark - Special Design */}
                  {isImageBookmark && bookmark.url ? (
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative"
                    >
                      <img
                        src={bookmark.url}
                        alt={bookmark.title}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '600px' }}
                        onError={(e) => {
                          e.currentTarget.src = bookmark.image_url || ''
                        }}
                      />

                      {/* Title overlay at top - only show if title exists */}
                      {bookmark.title && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3">
                          <h3 className="text-white font-semibold text-base line-clamp-2 drop-shadow-lg">
                            {bookmark.title}
                          </h3>
                        </div>
                      )}

                      {/* Timestamps overlay at bottom - always show */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="flex items-center gap-2 text-[9px] text-white/90">
                          <div className="flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            <span className="font-medium">Created:</span> {format(new Date(bookmark.created_at), 'MMM d, yy HH:mm')}
                          </div>
                          {bookmark.updated_at && bookmark.updated_at !== bookmark.created_at && (
                            <>
                              <span className="text-white/60">•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-2 h-2" />
                                <span className="font-medium">Edited:</span> {format(new Date(bookmark.updated_at), 'MMM d, yy HH:mm')}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </a>
                  ) : bookmark.image_url && !isImageBookmark && (
                    <a
                      href={bookmark.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-image-container block border-b border-[#eaeaea]"
                    >
                      <img
                        src={bookmark.image_url}
                        alt={bookmark.title}
                        className="bookmark-image w-full h-36 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.parentElement!.parentElement!.style.display = 'none'
                        }}
                      />
                    </a>
                  )}

                  {/* Regular bookmark content (not for image bookmarks) */}
                  {!isImageBookmark && (
                  <div className="bookmark-content p-3">
                    {bookmark.url && (
                      <div className="bookmark-url-display mb-1.5">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate leading-tight"
                        >
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{bookmark.url}</span>
                        </a>
                      </div>
                    )}

                    {/* Only show title if it exists */}
                    {bookmark.title && (
                      <div className="bookmark-header flex items-start justify-between mb-2">
                        {bookmark.url ? (
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bookmark-title text-sm font-semibold text-gray-900 line-clamp-2 flex-1 hover:text-blue-600 transition-colors cursor-pointer leading-tight"
                          >
                            {bookmark.title}
                          </a>
                        ) : (
                          <h3 className="bookmark-title text-sm font-semibold text-gray-900 line-clamp-2 flex-1 leading-tight">
                            {bookmark.title}
                          </h3>
                        )}
                        {bookmark.is_favorite && (
                          <Heart className="bookmark-favorite-icon w-3.5 h-3.5 text-red-500 fill-current flex-shrink-0 ml-2" />
                        )}
                      </div>
                    )}

                    {/* For text bookmarks, show summary (text content) when no title or when title is provided */}
                    {isTextBookmark && bookmark.summary && (
                      <p className="bookmark-text-content text-xs text-gray-700 mb-2 line-clamp-3 leading-snug">
                        {bookmark.summary}
                      </p>
                    )}

                    {/* For URL bookmarks, show meta description if enabled */}
                    {!isTextBookmark && bookmark.meta_description && bookmark.show_meta_description !== false && (
                      <p className="bookmark-meta-description text-xs text-gray-500 mb-2 line-clamp-2 italic leading-snug">
                        {bookmark.meta_description}
                      </p>
                    )}

                    {bookmark.notes.length > 0 && (
                      <div className="bookmark-notes-container mb-2">
                        <label className="text-[10px] font-semibold text-gray-700 mb-1.5 block">Notes</label>
                        <div className="space-y-1.5">
                          {(expandedNotesBookmarks.has(bookmark.id)
                            ? bookmark.notes
                            : bookmark.notes.slice(0, 3)
                          ).map((note) => (
                            <div
                              key={note.id}
                              className="bookmark-note bg-gradient-to-r from-blue-50 to-indigo-50 border-l-3 border-blue-500 p-2 rounded-r relative group cursor-pointer hover:shadow-sm transition-shadow"
                              onClick={() => handleNoteClick(note, bookmark.id)}
                              title="Click to view full note"
                            >
                              <p className="bookmark-note-text text-xs text-blue-800 line-clamp-2 leading-snug">
                                {note.content}
                              </p>
                            </div>
                          ))}
                          {bookmark.notes.length > 3 && (
                            <button
                              onClick={() => handleToggleOlderNotes(bookmark.id)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {expandedNotesBookmarks.has(bookmark.id)
                                ? '- Show fewer notes'
                                : `+ ${bookmark.notes.length - 3} older notes`
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {bookmark.categories.length > 0 && (
                      <div className="bookmark-categories flex flex-wrap gap-1 mb-2">
                        {bookmark.categories.map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="bookmark-category text-[10px] py-0 h-5">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {bookmark.tags.length > 0 && (
                      <div className="bookmark-tags flex flex-wrap gap-1 mb-2">
                        {bookmark.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bookmark-tag text-[10px] py-0 h-5">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="outline" className="bookmark-tags-more text-[10px] py-0 h-5">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="bookmark-footer flex items-center gap-2 text-[9px] text-gray-500 mt-2 pt-1.5 border-t border-gray-100 bg-gray-50/50 -mx-3 px-3 -mb-3 pb-2">
                      <div className="bookmark-timestamp flex items-center gap-1">
                        <Clock className="w-2 h-2" />
                        <span className="font-medium">Created:</span> {format(new Date(bookmark.created_at), 'MMM d, yy HH:mm')}
                      </div>
                      {bookmark.updated_at && bookmark.updated_at !== bookmark.created_at && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="bookmark-edited flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            <span className="font-medium">Edited:</span> {format(new Date(bookmark.updated_at), 'MMM d, yy HH:mm')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )}
                </div>
                )
              }

              return (
                <>
                  {/* Uncategorized Section */}
                  {uncategorized.length > 0 && (
                    <>
                      <div className="category-section">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg px-6 py-4 mb-6 border-l-4 border-gray-400">
                          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Uncategorized
                            <span className="text-sm font-normal bg-white px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                              {uncategorized.length}
                            </span>
                          </h2>
                        </div>
                        <div className="bookmarks-masonry columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
                          {uncategorized.map(renderBookmarkCard)}
                        </div>
                      </div>
                      {sortedCategories.length > 0 && (
                        <div className="category-separator border-t-2 border-gray-200 my-10"></div>
                      )}
                    </>
                  )}

                  {/* Categorized Sections */}
                  {sortedCategories.map((category, idx) => (
                    <div key={category}>
                      <div className="category-section">
                        <div className="bg-gradient-to-r from-purple-100 to-pink-50 rounded-lg px-6 py-4 mb-6 border-l-4 border-purple-500">
                          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {category}
                            <span className="text-sm font-normal bg-white px-3 py-1 rounded-full text-purple-600 border border-purple-200">
                              {categorizedMap.get(category)!.length}
                            </span>
                          </h2>
                        </div>
                        <div className="bookmarks-masonry columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
                          {categorizedMap.get(category)!.map(renderBookmarkCard)}
                        </div>
                      </div>
                      {idx < sortedCategories.length - 1 && (
                        <div className="category-separator border-t-2 border-gray-200 my-10"></div>
                      )}
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        )}
      </main>

      {/* Add Bookmark Dialog */}
      <AddBookmarkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchBookmarks}
      />

      {/* Edit Bookmark Dialog */}
      <EditBookmarkDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchBookmarks}
        bookmark={editingBookmark}
      />

      {/* Note Dialog */}
      <NoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        note={selectedNote}
        bookmarkId={selectedNoteBookmarkId}
        onSuccess={fetchBookmarks}
      />
    </div>
  )
}
