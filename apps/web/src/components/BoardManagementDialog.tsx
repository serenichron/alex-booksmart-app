import { useState, useEffect } from 'react'
import { createBoard, renameBoard, type Board } from '@/lib/storage'
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

interface BoardManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  mode: 'create' | 'rename'
  board?: Board | null
}

export function BoardManagementDialog({
  open,
  onOpenChange,
  onSuccess,
  mode,
  board,
}: BoardManagementDialogProps) {
  const [boardName, setBoardName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'rename' && board) {
        setBoardName(board.name)
      } else {
        setBoardName('')
      }
      setError('')
    }
  }, [open, mode, board])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!boardName.trim()) {
      setError('Please enter a board name')
      return
    }

    try {
      if (mode === 'create') {
        createBoard(boardName.trim())
      } else if (mode === 'rename' && board) {
        renameBoard(board.id, boardName.trim())
      }

      onSuccess()
      onOpenChange(false)
      setBoardName('')
    } catch (err) {
      setError('Failed to save board')
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle>
              {mode === 'create' ? 'Create New Board' : 'Rename Board'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Enter a name for your new board'
                : 'Enter a new name for this board'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-2">
              <label htmlFor="boardName" className="text-sm font-medium">
                Board Name
              </label>
              <Input
                id="boardName"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Enter board name"
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
              {mode === 'create' ? 'Create Board' : 'Rename Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
