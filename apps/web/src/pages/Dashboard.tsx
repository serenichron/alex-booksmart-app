import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddBookmarkDialog } from '@/components/AddBookmarkDialog'
import { Bookmark, Plus, Search, Sparkles, ExternalLink, Heart, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BookmarkWithDetails {
  id: string
  title: string
  summary: string | null
  url: string | null
  type: string
  created_at: string
  is_favorite: boolean
  categories: { id: string; name: string }[]
  tags: { id: string; name: string }[]
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    tags: 0,
    thisWeek: 0,
  })

  const fetchBookmarks = async () => {
    if (!user) return

    try {
      // Fetch bookmarks with categories and tags
      const { data: bookmarksData, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          title,
          summary,
          url,
          type,
          created_at,
          is_favorite,
          bookmark_categories (
            category:categories (
              id,
              name
            )
          ),
          bookmark_tags (
            tag:tags (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to flatten categories and tags
      const transformedBookmarks: BookmarkWithDetails[] = (bookmarksData || []).map((bookmark: any) => ({
        id: bookmark.id,
        title: bookmark.title,
        summary: bookmark.summary,
        url: bookmark.url,
        type: bookmark.type,
        created_at: bookmark.created_at,
        is_favorite: bookmark.is_favorite,
        categories: bookmark.bookmark_categories?.map((bc: any) => bc.category).filter(Boolean) || [],
        tags: bookmark.bookmark_tags?.map((bt: any) => bt.tag).filter(Boolean) || [],
      }))

      setBookmarks(transformedBookmarks)

      // Fetch stats
      const { count: totalCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: tagsCount } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: thisWeekCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString())

      setStats({
        total: totalCount || 0,
        categories: categoriesCount || 0,
        tags: tagsCount || 0,
        thisWeek: thisWeekCount || 0,
      })
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                <Bookmark className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gray-900">Alex Via</span>
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
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
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
            Welcome back, {user?.user_metadata?.full_name || 'there'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Your AI-powered bookmark collection is ready
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Bookmarks</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Categories</div>
            <div className="text-3xl font-bold text-gray-900">{stats.categories}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Tags</div>
            <div className="text-3xl font-bold text-gray-900">{stats.tags}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">This Week</div>
            <div className="text-3xl font-bold text-gray-900">{stats.thisWeek}</div>
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
              Save your first bookmark and let AI organize it for you. It's magic! ✨
            </p>
            <Button size="lg" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-5 h-5" />
              Add Your First Bookmark
            </Button>
          </div>
        ) : (
          /* Bookmarks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {bookmark.title}
                  </h3>
                  {bookmark.is_favorite && (
                    <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0 ml-2" />
                  )}
                </div>

                {bookmark.summary && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {bookmark.summary}
                  </p>
                )}

                {bookmark.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {bookmark.categories.map((cat) => (
                      <Badge key={cat.id} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {bookmark.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {bookmark.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{bookmark.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                  </div>
                  {bookmark.url && (
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
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
