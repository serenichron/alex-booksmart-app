import { useState, useEffect, useRef } from 'react'
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
import { Loader2, Link as LinkIcon, FileText, Pencil } from 'lucide-react'

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
  const [titleEdited, setTitleEdited] = useState(false)

  const fetchTimeoutRef = useRef<NodeJS.Timeout>()
  const lastFetchedUrlRef = useRef<string>('')

  const reset = () => {
    setMode('url')
    setUrl('')
    setNotes('')
    setTextContent('')
    setTitle('')
    setImageUrl('')
    setMetaDescription('')
    setTitleEdited(false)
    setError('')
    setLoading(false)
    setFetchingMetadata(false)
    lastFetchedUrlRef.current = ''
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const fetchMetadata = async (urlToFetch: string) => {
    setFetchingMetadata(true)
    setError('')

    try {
      const metadata = await fetchURLMetadata(urlToFetch)
      setTitle(metadata.title)
      setMetaDescription(metadata.description)
      if (metadata.image) setImageUrl(metadata.image)
      setTitleEdited(false)
      lastFetchedUrlRef.current = urlToFetch
    } catch (err) {
      console.error('Failed to fetch metadata:', err)
    } finally {
      setFetchingMetadata(false)
    }
  }

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)

    // Clear fetched data if user is typing a completely different URL
    if (lastFetchedUrlRef.current && !newUrl.startsWith(lastFetchedUrlRef.current.substring(0, 20))) {
      setTitle('')
      setImageUrl('')
      setMetaDescription('')
      setTitleEdited(false)
      lastFetchedUrlRef.current = ''
    }

    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    // Only fetch if URL looks complete (has protocol and domain with TLD)
    const urlPattern = /^https?:\/\/[^\s]+\.[^\s]+$/
    if (urlPattern.test(newUrl)) {
      // Debounce: wait 800ms after user stops typing
      fetchTimeoutRef.current = setTimeout(() => {
        fetchMetadata(newUrl)
      }, 800)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

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
      <DialogContent className="add-bookmark-dialog sm:max-w-[600px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Bookmark</DialogTitle>
          <DialogDescription className="text-base">
            Save a link or text snippet to your collection
          </DialogDescription>
        </DialogHeader>

        <div className="bookmark-mode-selector flex gap-2 mb-6 mt-4">
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

              {(title || imageUrl || metaDescription) && (
                <div className="metadata-preview bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 space-y-3">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Preview</p>

                  {imageUrl && (
                    <div className="bookmark-preview-image">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  {title && (
                    <div className="fetched-title space-y-2">
                      <label htmlFor="title-edit" className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        Title (click to edit)
                      </label>
                      <div className="relative">
                        <Input
                          id="title-edit"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value)
                            setTitleEdited(true)
                          }}
                          className="font-semibold pr-10"
                          placeholder="Enter title"
                        />
                        <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {metaDescription && (
                    <div className="fetched-description">
                      <p className="text-sm text-gray-600 italic leading-relaxed">{metaDescription}</p>
                    </div>
                  )}
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
