import { Button } from '@/components/ui/button'
import { Bookmark, Folder, Search, Zap, CheckCircle, Tag } from 'lucide-react'

interface LandingProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function Landing({ onGetStarted, onSignIn }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-teal-100/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              BookSmart
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={onSignIn}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Save anything,
            <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              organize infinitely
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your ultimate bookmark manager with unlimited nested folders, powerful search, and multiple content types.
            Stay organized across all your projects.
          </p>
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Free
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
              <Folder className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlimited Organization</h3>
            <p className="text-gray-600 text-sm">
              Create boards, folders, and unlimited subfolders. Organize your way with infinite nesting.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 text-sm">
              Optimized for 1000+ bookmarks with instant search, smart caching, and blazing-fast performance.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Content Types</h3>
            <p className="text-gray-600 text-sm">
              Save links, images, text snippets, and to-do lists. Everything you need in one place.
            </p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Everything you need</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Search className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Powerful Search</h4>
                <p className="text-sm text-gray-600">Search across all boards or within a specific board</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Categories & Tags</h4>
                <p className="text-sm text-gray-600">Organize with multi-category support and flexible tagging</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bookmark className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Rich Notes</h4>
                <p className="text-sm text-gray-600">Add multiple notes to any bookmark with timestamps</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Bulk Import</h4>
                <p className="text-sm text-gray-600">Paste up to 20 URLs at once for quick batch saving</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get organized?</h2>
          <p className="text-gray-600 mb-6">Join now and take control of your bookmarks</p>
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-100/50 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
          <p>Built with ❤️ using React, TypeScript, and Supabase</p>
        </div>
      </footer>
    </div>
  )
}
