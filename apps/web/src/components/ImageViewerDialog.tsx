import { ExternalLink, X, Share2, Pencil } from 'lucide-react'
import { useEffect } from 'react'
import type { Bookmark } from '@/lib/storage'

interface ImageViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Bookmark | null
  onEdit?: (bookmark: Bookmark) => void
  onShare?: (bookmark: Bookmark) => void
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  bookmark,
  onEdit,
  onShare
}: ImageViewerDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open || !bookmark) return null

  const imageUrl = bookmark.url || bookmark.image_url

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-8"
      onClick={handleBackgroundClick}
    >
      <div className="relative flex flex-col items-center max-w-[90vw] max-h-[90vh]">
        {/* Title above image */}
        {bookmark.title && (
          <h2 className="text-white text-xl font-semibold mb-4 text-left max-w-3xl w-full">
            {bookmark.title}
          </h2>
        )}

        {/* Image container */}
        <div className="relative">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={bookmark.title || 'Image'}
              className="max-w-full max-h-[calc(90vh-100px)] object-contain border-2 rounded-[0.3rem]"
              style={{ borderColor: '#666' }}
              onError={(e) => {
                const fallback = bookmark.image_url || bookmark.url
                if (fallback && fallback !== e.currentTarget.src) {
                  e.currentTarget.src = fallback
                }
              }}
            />
          )}

          {/* Floating action buttons - positioned outside the image */}
          <div className="absolute -top-3 -right-3 flex gap-2">
            {imageUrl && (
              <button
                onClick={() => window.open(imageUrl, '_blank')}
                className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg backdrop-blur-sm"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(bookmark)}
                className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg backdrop-blur-sm"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(bookmark)
                  onOpenChange(false)
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg backdrop-blur-sm"
                title="Edit"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg backdrop-blur-sm"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
