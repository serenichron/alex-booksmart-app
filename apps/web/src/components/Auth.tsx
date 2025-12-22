import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, UserPlus, LogIn, ArrowLeft } from 'lucide-react'

interface AuthProps {
  mode?: 'signup' | 'signin'
  onBack?: () => void
}

export function Auth({ mode = 'signup', onBack }: AuthProps = {}) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, firstName, lastName)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Account created successfully! You can now log in.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Different styling for sign up vs log in - using consistent cyan/teal theme
  const bgGradient = 'bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900'

  const primaryColor = isSignUp
    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700'
    : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'

  const iconBg = isSignUp
    ? 'bg-gradient-to-br from-cyan-400 to-teal-500'
    : 'bg-gradient-to-br from-teal-400 to-cyan-500'

  const glowColor = isSignUp ? 'shadow-cyan-500/20' : 'shadow-teal-500/20'

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgGradient} relative overflow-hidden`}>
      {/* Animated gradient shapes - different per mode */}
      {isSignUp ? (
        <>
          <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-500 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-80 h-80 bg-cyan-400 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
        </>
      ) : (
        <>
          <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-80 h-80 bg-teal-400 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
        </>
      )}

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className={`bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl ${glowColor} p-8 border border-white/20`}>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`flex items-center justify-center w-16 h-16 ${iconBg} rounded-2xl mx-auto mb-4`}>
              {isSignUp ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-300">
              {isSignUp
                ? 'Get started with BookSmart for free'
                : 'Log in to continue to your bookmarks'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-200 mb-1">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-white/50"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-200 mb-1">
                    Last Name <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    className="w-full bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-white/50"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-white/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-white/50"
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                {message}
              </div>
            )}

            <Button
              type="submit"
              className={`w-full text-white ${primaryColor}`}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Logging in...'}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setMessage(null)
                setEmail('')
                setPassword('')
                setFirstName('')
                setLastName('')
              }}
              className={`text-sm font-medium ${
                isSignUp
                  ? 'text-cyan-300 hover:text-cyan-200'
                  : 'text-teal-300 hover:text-teal-200'
              }`}
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Log in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  )
}
