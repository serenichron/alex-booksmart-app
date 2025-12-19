import { useState } from 'react'
import { Dashboard } from '@/pages/Dashboard'
import { Landing } from '@/pages/Landing'
import { Auth } from '@/components/Auth'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

type View = 'landing' | 'signup' | 'signin'

function AppContent() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<View>('landing')

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
        onGetStarted={() => setView('signup')}
        onSignIn={() => setView('signin')}
      />
    )
  }

  // Show auth (signup or signin)
  return (
    <Auth
      mode={view === 'signup' ? 'signup' : 'signin'}
      onBack={() => setView('landing')}
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
