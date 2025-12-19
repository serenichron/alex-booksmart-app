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
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Account created successfully! You can now sign in.')
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

  // Different styling for sign up vs sign in
  const bgGradient = isSignUp
    ? 'bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50'
    : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'

  const primaryColor = isSignUp
    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'

  const iconBg = isSignUp ? 'bg-teal-500' : 'bg-blue-600'

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgGradient} transition-colors duration-300`}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`flex items-center justify-center w-16 h-16 ${iconBg} rounded-2xl mx-auto mb-4 transition-colors duration-300`}>
              {isSignUp ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600">
              {isSignUp
                ? 'Get started with BookSmart for free'
                : 'Sign in to continue to your bookmarks'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full"
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <Button
              type="submit"
              className={`w-full text-white ${primaryColor} transition-all duration-300`}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
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
                      Sign In
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
              }}
              className={`text-sm font-medium transition-colors ${
                isSignUp
                  ? 'text-teal-600 hover:text-teal-700'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
