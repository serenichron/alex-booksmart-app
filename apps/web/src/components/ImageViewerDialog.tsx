import { ExternalLink, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { Bookmark, Note } from '@/lib/storage'

interface ImageViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Bookmark | null
  onNoteClick?: (note: Note) => void
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  bookmark,
  onNoteClick
}: ImageViewerDialogProps) {
  if (!bookmark) return null

  const imageUrl = bookmark.url || bookmark.image_url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex-1 min-w-0">
            {bookmark.title && (
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {bookmark.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {imageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(imageUrl, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-hidden">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={bookmark.title || 'Image'}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const fallback = bookmark.image_url || bookmark.url
                  if (fallback && fallback !== e.currentTarget.src) {
                    e.currentTarget.src = fallback
                  }
                }}
              />
            )}
          </div>

          {/* Notes Sidebar */}
          {bookmark.notes && bookmark.notes.length > 0 && (
            <div className="w-80 border-l bg-white flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notes ({bookmark.notes.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {bookmark.notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-3 border-blue-500 p-3 rounded-r cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => onNoteClick?.(note)}
                  >
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                      {note.content}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {bookmark.categories && bookmark.categories.length > 0 && (
              <div className="flex items-center gap-1">
                {bookmark.categories.map((cat, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] py-0 h-5">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {bookmark.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] py-0 h-5">
                    {tag}
                  </Badge>
                ))}
                {bookmark.tags.length > 3 && (
                  <Badge variant="outline" className="text-[10px] py-0 h-5">
                    +{bookmark.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="text-[10px] text-gray-500">
            Created {format(new Date(bookmark.created_at), 'MMM d, yyyy')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
