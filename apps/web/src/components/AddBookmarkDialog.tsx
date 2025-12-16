import { useState } from 'react'
import { saveBookmark } from '@/lib/storage'
import { fetchURLMetadata } from '@/lib/metadata'
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
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Link as LinkIcon, FileText } from 'lucide-react'

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddBookmarkDialogProps) {
  const [mode, setMode] = useState<'url' | 'text'>('url')
  const [loading, setLoading] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [error, setError] = useState('')

  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [textContent, setTextContent] = useState('')

  // Auto-fetched metadata
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const reset = () => {
    setMode('url')
    setUrl('')
    setNotes('')
    setTextContent('')
    setTitle('')
    setImageUrl('')
    setMetaDescription('')
    setError('')
    setLoading(false)
    setFetchingMetadata(false)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)

    // Auto-fetch metadata when URL is valid
    if (newUrl && newUrl.startsWith('http')) {
      setFetchingMetadata(true)
      setError('')

      try {
        const metadata = await fetchURLMetadata(newUrl)
        setTitle(metadata.title)
        setMetaDescription(metadata.description)
        if (metadata.image) setImageUrl(metadata.image)
      } catch (err) {
        console.error('Failed to fetch metadata:', err)
        // Don't show error, just fail silently
      } finally {
        setFetchingMetadata(false)
      }
    }
  }

  const handleSave = () => {
    if (mode === 'url' && !url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (mode === 'text' && !textContent.trim()) {
      setError('Please enter some text')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (mode === 'url') {
        // Save URL bookmark
        saveBookmark({
          title: title || url,
          summary: metaDescription || '',
          notes: notes.trim(),
          url: url.trim(),
          type: 'link',
          is_favorite: false,
          categories: [],
          tags: [],
          image_url: imageUrl || null,
          meta_description: metaDescription || null,
        })
      } else {
        // Save text bookmark
        saveBookmark({
          title: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : ''),
          summary: textContent,
          notes: notes.trim(),
          url: null,
          type: 'text',
          is_favorite: false,
          categories: [],
          tags: [],
          image_url: null,
          meta_description: null,
        })
      }

      handleClose()
      onSuccess()
    } catch (err) {
      setError('Failed to save bookmark. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="add-bookmark-dialog">
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
          <DialogDescription>
            Save a link or text snippet to your collection
          </DialogDescription>
        </DialogHeader>

        <div className="bookmark-mode-selector flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'url' ? 'default' : 'outline'}
            onClick={() => setMode('url')}
            className="flex-1"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </Button>
          <Button
            type="button"
            variant={mode === 'text' ? 'default' : 'outline'}
            onClick={() => setMode('text')}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Text
          </Button>
        </div>

        <div className="add-bookmark-form space-y-4">
          {error && (
            <div className="error-message bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {mode === 'url' ? (
            <>
              <div className="url-field space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  URL *
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={loading}
                  className="bookmark-url-input"
                />
                {fetchingMetadata && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching metadata...
                  </p>
                )}
              </div>

              {imageUrl && (
                <div className="bookmark-preview">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="bookmark-image-preview w-full h-32 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {title && (
                <div className="fetched-title">
                  <p className="text-sm font-medium text-gray-700">{title}</p>
                </div>
              )}

              {metaDescription && (
                <div className="fetched-description">
                  <p className="text-xs text-gray-500 italic">{metaDescription}</p>
                </div>
              )}

              <div className="notes-field space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes (optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Your thoughts, why you saved this, context..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={4}
                  className="bookmark-notes-input"
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-content-field space-y-2">
                <label htmlFor="textContent" className="text-sm font-medium">
                  Text Content *
                </label>
                <Textarea
                  id="textContent"
                  placeholder="Paste or type your text snippet here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={loading}
                  rows={6}
                  className="bookmark-text-input"
                />
              </div>

              <div className="notes-field space-y-2">
                <label htmlFor="notes-text" className="text-sm font-medium">
                  Notes (optional)
                </label>
                <Textarea
                  id="notes-text"
                  placeholder="Context, source, or additional thoughts..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="bookmark-notes-input"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || fetchingMetadata}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Bookmark'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
