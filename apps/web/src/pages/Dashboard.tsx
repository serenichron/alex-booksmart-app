import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddBookmarkDialog } from '@/components/AddBookmarkDialog'
import { EditBookmarkDialog } from '@/components/EditBookmarkDialog'
import { Bookmark, Plus, Search, Sparkles, ExternalLink, Heart, Clock, Trash2, Pencil, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { getBookmarks, getStats, deleteBookmark, type Bookmark as BookmarkType, type Note } from '@/lib/storage'

interface BookmarkWithDetails extends BookmarkType {}

export function Dashboard() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null)
  const [bookmarks, setBookmarks] = useState<BookmarkWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    tags: 0,
    thisWeek: 0,
  })

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
    const uncategorized = bookmarks.filter(b => b.categories.length === 0)
    const categorizedMap = new Map<string, BookmarkWithDetails[]>()

    bookmarks.forEach(bookmark => {
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

  useEffect(() => {
    fetchBookmarks()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                <Bookmark className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gray-900">BookSmart</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4" />
                Add Bookmark
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to BookSmart 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Your smart bookmark collection - saved locally in your browser
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stats-card bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-blue-100 mb-1">Total Bookmarks</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-purple-100 mb-1">Categories</div>
            <div className="text-3xl font-bold text-white">{stats.categories}</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-pink-100 mb-1">Tags</div>
            <div className="text-3xl font-bold text-white">{stats.tags}</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-sm text-indigo-100 mb-1">This Week</div>
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
        ) : (
          /* Bookmarks Organized by Category */
          <div className="bookmarks-by-category space-y-10">
            {(() => {
              const { uncategorized, categorizedMap, sortedCategories } = groupedByCategory()

              const renderBookmarkCard = (bookmark: BookmarkWithDetails) => {
                const isTextBookmark = !bookmark.url
                return (
                <div
                  key={bookmark.id}
                  className={`bookmark-card rounded-xl border overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 break-inside-avoid mb-6 relative group ${
                    isTextBookmark
                      ? 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 border-yellow-300 shadow-md'
                      : 'bg-white border-gray-200/60'
                  }`}
                >
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bookmark.url && (
                      <button
                        onClick={() => handleShare(bookmark)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow-lg"
                        title="Share bookmark"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(bookmark)}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow-lg"
                      title="Edit bookmark"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {bookmark.image_url && (
                    <a
                      href={bookmark.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-image-container block border-b border-[#eaeaea]"
                    >
                      <img
                        src={bookmark.image_url}
                        alt={bookmark.title}
                        className="bookmark-image w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.parentElement!.parentElement!.style.display = 'none'
                        }}
                      />
                    </a>
                  )}

                  <div className="bookmark-content p-5">
                    {bookmark.url && (
                      <div className="bookmark-url-display mb-2">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{bookmark.url}</span>
                        </a>
                      </div>
                    )}

                    <div className="bookmark-header flex items-start justify-between mb-3">
                      {bookmark.url ? (
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bookmark-title font-semibold text-gray-900 line-clamp-2 flex-1 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {bookmark.title}
                        </a>
                      ) : (
                        <h3 className="bookmark-title font-semibold text-gray-900 line-clamp-2 flex-1">
                          {bookmark.title}
                        </h3>
                      )}
                      {bookmark.is_favorite && (
                        <Heart className="bookmark-favorite-icon w-4 h-4 text-red-500 fill-current flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {bookmark.meta_description && (
                      <p className="bookmark-meta-description text-sm text-gray-500 mb-3 line-clamp-2 italic">
                        {bookmark.meta_description}
                      </p>
                    )}

                    {bookmark.notes.length > 0 && (
                      <div className="bookmark-notes-container mb-3 space-y-2">
                        {bookmark.notes.slice(0, 3).map((note) => (
                          <div key={note.id} className="bookmark-note bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-3 rounded-r">
                            <p className="bookmark-note-text text-sm text-blue-800">
                              {note.content}
                            </p>
                          </div>
                        ))}
                        {bookmark.notes.length > 3 && (
                          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            + {bookmark.notes.length - 3} older notes
                          </button>
                        )}
                      </div>
                    )}

                    {bookmark.categories.length > 0 && (
                      <div className="bookmark-categories flex flex-wrap gap-1.5 mb-3">
                        {bookmark.categories.map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="bookmark-category text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {bookmark.tags.length > 0 && (
                      <div className="bookmark-tags flex flex-wrap gap-1.5 mb-3">
                        {bookmark.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bookmark-tag text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="outline" className="bookmark-tags-more text-xs">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="bookmark-footer flex flex-col gap-1.5 text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100 bg-gray-50/50 -mx-5 px-5 -mb-5 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="bookmark-timestamp flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">Created:</span> {format(new Date(bookmark.created_at), 'MMM d, yy HH:mm')}
                        </div>
                        {bookmark.url && (
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bookmark-visit-link flex items-center gap-1 text-primary hover:underline"
                          >
                            Visit
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {bookmark.updated_at && bookmark.updated_at !== bookmark.created_at && (
                        <div className="bookmark-edited flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">Edited:</span> {format(new Date(bookmark.updated_at), 'MMM d, yy HH:mm')}
                        </div>
                      )}
                    </div>
                  </div>
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
    </div>
  )
}
