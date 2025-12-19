import { Button } from '@/components/ui/button'
import { Bookmark, Folder, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

interface LandingProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function Landing({ onGetStarted, onSignIn }: LandingProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 relative overflow-hidden flex flex-col">
      {/* Animated gradient shapes - variety of forms */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-500 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-cyan-400 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-400 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-6000"></div>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md flex-shrink-0 relative z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              BookSmart
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={onSignIn}
            className="text-white hover:text-cyan-300 hover:bg-white/10"
          >
            Log In
          </Button>
        </div>
      </header>

      {/* Main Content - Centered in remaining space */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-y-auto">
        <div className="max-w-4xl w-full text-center py-8">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-cyan-400/30">
            <Sparkles className="w-4 h-4" />
            <span>Beta - Join our early testers</span>
          </div>

          {/* Hero */}
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
              Tired of losing track?
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 mt-2">
                Keep everything organized.
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              If you save articles, resources, and ideas but can never find them when you need them,
              BookSmart helps you organize everything in one place.
            </p>
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all group"
            >
              Join the Beta
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* The Plan (3 Simple Steps) */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:border-cyan-400/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Bookmark className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Save Anything</h3>
              <p className="text-gray-300 text-sm">
                Links, images, notes, to-do lists. Everything in one place.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:border-teal-400/50 transition-all">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Folder className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Organize Your Way</h3>
              <p className="text-gray-300 text-sm">
                Create boards and folders. Nest them as deep as you need.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:border-cyan-400/50 transition-all">
              <div className="w-12 h-12 bg-cyan-400/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <CheckCircle className="w-6 h-6 text-cyan-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Find What You Need</h3>
              <p className="text-gray-300 text-sm">
                Search across everything. No more lost bookmarks.
              </p>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mt-8 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Coming Soon</h3>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
              <span className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">📍 Location bookmarks</span>
              <span className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">🎥 Video support</span>
              <span className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">👥 Shared boards</span>
              <span className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">🔗 Shareable collections</span>
              <span className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">🔌 Browser extension</span>
            </div>
          </div>

          {/* Beta Call to Action */}
          <div className="mt-6 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <p className="text-gray-300 text-sm">
              We're looking for early testers to help shape BookSmart. Join the beta and get early access to new features.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-md py-4 flex-shrink-0 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>Built for researchers, students, developers, and anyone who saves things online</p>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -50px) scale(1.1) rotate(120deg); }
          66% { transform: translate(-20px, 20px) scale(0.9) rotate(240deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
    </div>
  )
}


