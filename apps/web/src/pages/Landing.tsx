import { Button } from '@/components/ui/button'
import { Bookmark, Folder, CheckCircle, ArrowRight } from 'lucide-react'

interface LandingProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export function Landing({ onGetStarted, onSignIn }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
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
              Sign In
            </Button>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl w-full text-center">
            {/* Hero */}
            <div className="mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
                Your bookmarks are a mess.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mt-2">
                  We can fix that.
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                If you're drowning in browser tabs and can't find that article you saved last week,
                BookSmart gives you a better way to organize everything.
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* The Plan (3 Simple Steps) */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Bookmark className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Save Anything</h3>
                <p className="text-gray-300 text-sm">
                  Links, images, notes, to-do lists. Everything in one place.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Folder className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Organize Your Way</h3>
                <p className="text-gray-300 text-sm">
                  Create boards and folders. Nest them as deep as you need.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-pink-400/50 transition-all">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Find What You Need</h3>
                <p className="text-gray-300 text-sm">
                  Search across everything. No more lost bookmarks.
                </p>
              </div>
            </div>

            {/* Social Proof / Stakes */}
            <div className="mt-16 bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <p className="text-gray-300 text-sm mb-4">
                Stop losing track of important resources. Start organizing today.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Export anytime</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-md py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
            <p>Built for researchers, students, developers, and anyone who saves things online</p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

