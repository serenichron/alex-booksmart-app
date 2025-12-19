import { useState, useEffect } from 'react'
import { Dashboard } from '@/pages/Dashboard'
import { Landing } from '@/pages/Landing'
import { Auth } from '@/components/Auth'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

type View = 'landing' | 'signup' | 'signin'

function AppContent() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<View>('landing')

  // Initialize history state on mount
  useEffect(() => {
    // Set initial state if none exists
    if (!window.history.state?.view) {
      window.history.replaceState({ view: 'landing' }, '', window.location.href)
    }
  }, [])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setView(event.state.view)
      } else {
        setView('landing')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Helper function to change view with history support
  const navigateToView = (newView: View) => {
    setView(newView)
    window.history.pushState({ view: newView }, '', window.location.href)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  // If user is authenticated, show dashboard
  if (user) {
    return <Dashboard />
  }

  // Show appropriate view based on state
  if (view === 'landing') {
    return (
      <Landing
        onGetStarted={() => navigateToView('signup')}
        onSignIn={() => navigateToView('signin')}
      />
    )
  }

  // Show auth (signup or signin)
  return (
    <Auth
      mode={view === 'signup' ? 'signup' : 'signin'}
      onBack={() => navigateToView('landing')}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
