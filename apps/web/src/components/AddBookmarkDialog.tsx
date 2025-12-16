import { useState } from 'react'
import { saveBookmark, addCategory, addTag } from '@/lib/storage'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [type, setType] = useState<'link' | 'image' | 'text' | 'document' | 'video' | 'other'>('link')

  const reset = () => {
    setUrl('')
    setTitle('')
    setSummary('')
    setCategoryInput('')
    setTagInput('')
    setCategories([])
    setTags([])
    setType('link')
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleAddCategory = () => {
    const trimmed = categoryInput.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed])
      setCategoryInput('')
    }
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handler()
    }
  }

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat))
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Save bookmark to localStorage
      saveBookmark({
        title: title.trim(),
        summary: summary.trim(),
        url: url.trim() || null,
        type,
        is_favorite: false,
        categories,
        tags,
      })

      // Save categories and tags to their respective lists
      categories.forEach(cat => addCategory(cat))
      tags.forEach(tag => addTag(tag))

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
          <DialogDescription>
            Add a new bookmark to your collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-0">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="My awesome bookmark"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-medium">
              Summary
            </label>
            <Textarea
              id="summary"
              placeholder="Brief description or notes..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="link">Link</option>
              <option value="image">Image</option>
              <option value="text">Text</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categories</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add category"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAddCategory)}
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCategory}
                disabled={loading}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1">
                  {cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAddTag)}
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={loading}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
