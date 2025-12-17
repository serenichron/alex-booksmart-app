import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddBookmarkDialog } from '@/components/AddBookmarkDialog'
import { Bookmark, Plus, Search, Sparkles, ExternalLink, Heart, Clock, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getBookmarks, getStats, deleteBookmark, type Bookmark as BookmarkType } from '@/lib/storage'

interface BookmarkWithDetails extends BookmarkType {}

export function Dashboard() {
  const [showAddDialog, setShowAddDialog] = useState(false)
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

  const handleDelete = (id: string) => {
    if (confirm('Delete this bookmark?')) {
      deleteBookmark(id)
      fetchBookmarks()
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
          /* Bookmarks Masonry */
          <div className="bookmarks-masonry columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bookmark-card bg-white rounded-xl border border-gray-200/60 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 break-inside-avoid mb-6 relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {bookmark.image_url && (
                  <a
                    href={bookmark.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bookmark-image-container block"
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
                    <p className="bookmark-meta-description text-sm text-gray-500 mb-2 line-clamp-2 italic">
                      {bookmark.meta_description}
                    </p>
                  )}

                  {bookmark.summary && (
                    <p className="bookmark-summary text-sm text-gray-600 mb-3 line-clamp-2">
                      {bookmark.summary}
                    </p>
                  )}

                  {bookmark.notes && (
                    <div className="bookmark-notes bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-3 mb-3 rounded-r">
                      <p className="bookmark-notes-label text-xs font-medium text-blue-900 mb-1">
                        📝 Your Notes:
                      </p>
                      <p className="bookmark-notes-text text-sm text-blue-800 line-clamp-3">
                        {bookmark.notes}
                      </p>
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

                  <div className="bookmark-footer flex items-center justify-between text-xs text-gray-500 mt-4">
                    <div className="bookmark-timestamp flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Bookmark Dialog */}
      <AddBookmarkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchBookmarks}
      />
    </div>
  )
}
