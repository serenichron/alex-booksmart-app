import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { updateNoteInBookmark, deleteNoteFromBookmark, type Note } from '@/lib/storage'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note | null
  bookmarkId: string
  onSuccess: () => void
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  bookmarkId,
  onSuccess,
}: NoteDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  const handleEdit = () => {
    if (note) {
      setEditedContent(note.content)
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (note && editedContent.trim()) {
      updateNoteInBookmark(bookmarkId, note.id, editedContent.trim())
      setIsEditing(false)
      onSuccess()
      onOpenChange(false)
    }
  }

  const handleDelete = () => {
    if (note && confirm('Delete this note?')) {
      deleteNoteFromBookmark(bookmarkId, note.id)
      onSuccess()
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>Note Details</DialogTitle>
          <DialogDescription>
            View and edit your note
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="font-medium">Created:</span> {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')}
            </div>
          </div>

          {/* Note Content */}
          {isEditing ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit Note</label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Content</label>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
