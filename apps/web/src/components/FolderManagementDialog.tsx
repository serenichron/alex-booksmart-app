import { useState, useEffect } from 'react'
import { createFolder, renameFolder, type Folder } from '@/lib/storage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FolderManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  mode: 'create' | 'rename'
  boardId: string
  folder?: Folder | null
  parentFolderId?: string | null
}

export function FolderManagementDialog({
  open,
  onOpenChange,
  onSuccess,
  mode,
  boardId,
  folder,
  parentFolderId = null,
}: FolderManagementDialogProps) {
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'rename' && folder) {
        setFolderName(folder.name)
      } else {
        setFolderName('')
      }
      setError('')
    }
  }, [open, mode, folder])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderName.trim()) {
      setError('Please enter a folder name')
      return
    }

    try {
      if (mode === 'create') {
        await createFolder(boardId, folderName.trim(), parentFolderId)
      } else if (mode === 'rename' && folder) {
        await renameFolder(folder.id, folderName.trim())
      }

      onSuccess()
      onOpenChange(false)
      setFolderName('')
    } catch (err) {
      setError('Failed to save folder')
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle>
              {mode === 'create' ? 'Create New Folder' : 'Rename Folder'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Enter a name for your new folder'
                : 'Enter a new name for this folder'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="grid gap-2">
              <label htmlFor="folderName" className="text-sm font-medium">
                Folder Name
              </label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Folder' : 'Rename Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
