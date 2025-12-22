import { useState, useEffect, useRef } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface UserAvatarProps {
  onSettingsClick: () => void
}

export function UserAvatar({ onSettingsClick }: UserAvatarProps) {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load user's first name from profile
  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .single()

      if (data?.first_name) {
        setFirstName(data.first_name)
      }
    } catch (error) {
      console.log('No profile found')
    }
  }

  const getInitial = () => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const handleSettingsClick = () => {
    setShowMenu(false)
    onSettingsClick()
  }

  const handleLogout = async () => {
    setShowMenu(false)
    await signOut()
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D7D81] to-teal-600 dark:from-cyan-500 dark:to-teal-500 text-white font-semibold flex items-center justify-center hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#0D7D81] dark:focus:ring-cyan-400 focus:ring-offset-2"
        aria-label="User menu"
      >
        <span className="text-lg">{getInitial()}</span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D7D81] to-teal-600 dark:from-cyan-500 dark:to-teal-500 text-white font-semibold flex items-center justify-center">
                <span className="text-lg">{getInitial()}</span>
              </div>
              <div className="flex-1 min-w-0">
                {firstName && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {firstName}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <Settings className="w-4 h-4 text-[#0D7D81] dark:text-cyan-400" />
              <span>User Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
