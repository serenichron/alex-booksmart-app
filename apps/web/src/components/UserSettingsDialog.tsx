import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { User, KeyRound, Database, Mail, AlertCircle, CheckCircle, Download, Upload, Trash2, FileUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { exportAllData, importAllData, clearAllData, createBoard, createFolder, saveBookmark } from '@/lib/storage'
import { parseBookmarkHTML, importBrowserBookmarks, type ImportProgress } from '@/lib/bookmarkImport'

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Email state
  const [newEmail, setNewEmail] = useState('')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Browser bookmark import state
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load profile data on mount
  useEffect(() => {
    if (user && open) {
      loadProfile()
      setNewEmail(user.email || '')
    }
  }, [user, open])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // Profile might not exist yet, that's okay
        console.log('No profile found, will create on save')
        return
      }

      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    setLoading(true)
    setMessage(null)

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: firstName || null,
            last_name: lastName || null,
          })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!user || !newEmail) return

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Confirmation email sent! Please check your inbox to verify your new email address.',
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update email' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `booksmart-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Data exported successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to export data' })
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        await importAllData(data)
        setMessage({ type: 'success', text: 'Data imported successfully! Refreshing...' })
        setTimeout(() => window.location.reload(), 1500)
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Failed to import data' })
      }
    }
    input.click()
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL your data? This cannot be undone!')) {
      return
    }

    try {
      await clearAllData()
      setMessage({ type: 'success', text: 'All data cleared! Refreshing...' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to clear data' })
    }
  }

  const handleBrowserBookmarkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setImportProgress({ total: 0, processed: 0, current: 'Reading file...' })

      // Read and parse the HTML file
      const htmlContent = await file.text()
      const parsedBookmarks = parseBookmarkHTML(htmlContent)

      if (parsedBookmarks.length === 0) {
        setMessage({ type: 'error', text: 'No bookmarks found in the file' })
        setIsImporting(false)
        setImportProgress(null)
        return
      }

      setImportProgress({ total: parsedBookmarks.length, processed: 0, current: 'Creating board...' })

      // Create "Browser Bookmarks" board
      const board = await createBoard('Browser Bookmarks')

      // Create a map to track folders by their path
      const folderMap = new Map<string, string>() // path -> folderId

      // Helper to get or create folder
      const getOrCreateFolder = async (folderPath: string[]): Promise<string | null> => {
        if (folderPath.length === 0) return null

        const pathKey = folderPath.join('/')
        if (folderMap.has(pathKey)) {
          return folderMap.get(pathKey)!
        }

        // Create folders recursively
        let parentFolderId: string | null = null
        for (let i = 0; i < folderPath.length; i++) {
          const currentPath = folderPath.slice(0, i + 1)
          const currentPathKey = currentPath.join('/')

          if (!folderMap.has(currentPathKey)) {
            const folderName = currentPath[i]
            const folder = await createFolder(board.id, folderName, parentFolderId)
            folderMap.set(currentPathKey, folder.id)
            parentFolderId = folder.id
          } else {
            parentFolderId = folderMap.get(currentPathKey)!
          }
        }

        return parentFolderId
      }

      // Import bookmarks with metadata
      setImportProgress({ total: parsedBookmarks.length, processed: 0, current: 'Fetching metadata...' })

      const result = await importBrowserBookmarks(parsedBookmarks, (progress) => {
        setImportProgress(progress)
      })

      // Save bookmarks to storage
      setImportProgress({
        total: result.bookmarks.length,
        processed: 0,
        current: 'Saving bookmarks...'
      })

      for (let i = 0; i < result.bookmarks.length; i++) {
        const item = result.bookmarks[i]
        const folderId = await getOrCreateFolder(item.folder)

        await saveBookmark({
          title: item.metadata.title || item.title,
          summary: item.metadata.description || '',
          url: item.url,
          type: 'link',
          is_favorite: false,
          categories: [],
          tags: [],
          image_url: item.metadata.image,
          meta_description: item.metadata.description,
          favicon: item.metadata.favicon,
          show_meta_description: true,
          board_id: board.id,
          folder_id: folderId,
          notes: []
        })

        setImportProgress({
          total: result.bookmarks.length,
          processed: i + 1,
          current: item.title
        })
      }

      setIsImporting(false)
      setImportProgress(null)

      const errorMessage = result.errors.length > 0
        ? ` (${result.errors.length} failed)`
        : ''

      setMessage({
        type: 'success',
        text: `Imported ${result.bookmarks.length} bookmarks${errorMessage}! Refreshing...`
      })

      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      console.error('Browser bookmark import error:', error)
      setIsImporting(false)
      setImportProgress(null)
      setMessage({ type: 'error', text: error.message || 'Failed to import browser bookmarks' })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#0D7D81] to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
            User Settings
          </DialogTitle>
          <DialogDescription>
            Manage your profile, account settings, and data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Message Display */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <User className="w-5 h-5 text-[#0D7D81] dark:text-cyan-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Profile Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="border-gray-300 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="border-gray-300 dark:border-slate-600"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="bg-[#0D7D81] hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white"
            >
              Save Profile
            </Button>
          </div>

          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <Mail className="w-5 h-5 text-[#0D7D81] dark:text-cyan-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Email Address</h3>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Email: <span className="text-gray-500">{user?.email}</span>
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="border-gray-300 dark:border-slate-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You'll receive a confirmation email at your new address
              </p>
            </div>
            <Button
              onClick={handleUpdateEmail}
              disabled={loading || newEmail === user?.email}
              className="bg-[#0D7D81] hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white"
            >
              Update Email
            </Button>
          </div>

          {/* Password Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <KeyRound className="w-5 h-5 text-[#0D7D81] dark:text-cyan-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Password Management</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="border-gray-300 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="border-gray-300 dark:border-slate-600"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 6 characters
              </p>
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="bg-[#0D7D81] hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white"
            >
              Change Password
            </Button>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <Database className="w-5 h-5 text-[#0D7D81] dark:text-cyan-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Data Management</h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex-1 border-[#0D7D81] dark:border-cyan-500 text-[#0D7D81] dark:text-cyan-400 hover:bg-[#0D7D81]/10 dark:hover:bg-cyan-500/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button
                  onClick={handleImport}
                  variant="outline"
                  className="flex-1 border-[#0D7D81] dark:border-cyan-500 text-[#0D7D81] dark:text-cyan-400 hover:bg-[#0D7D81]/10 dark:hover:bg-cyan-500/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isImporting}
                className="w-full border-[#0D7D81] dark:border-cyan-500 text-[#0D7D81] dark:text-cyan-400 hover:bg-[#0D7D81]/10 dark:hover:bg-cyan-500/10"
              >
                <FileUp className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import Browser Bookmarks'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="text/html"
                onChange={handleBrowserBookmarkImport}
                className="hidden"
              />
              {importProgress && (
                <div className="bg-[#0D7D81]/5 dark:bg-cyan-500/5 border border-[#0D7D81]/20 dark:border-cyan-500/20 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {importProgress.current}
                    </span>
                    <span className="text-[#0D7D81] dark:text-cyan-400 font-medium">
                      {importProgress.processed} / {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0D7D81] to-teal-600 dark:from-cyan-400 dark:to-teal-400 h-full rounded-full"
                      style={{
                        width: `${importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="w-full border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Export your data as JSON, import from a backup, or permanently delete all your bookmarks
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
