import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get initial theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    return savedTheme || 'dark'
  })

  useEffect(() => {
    // Update HTML class and localStorage when theme changes
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    // Disable transitions during theme change for instant switch
    document.documentElement.classList.add('theme-transitioning')

    setTheme(prev => prev === 'dark' ? 'light' : 'dark')

    // Re-enable transitions after theme has been applied
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 0)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
