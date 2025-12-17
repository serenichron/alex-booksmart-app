import { useState, useEffect, useRef } from 'react'
import {
  updateBookmark,
  getCategories,
  addCategory,
  addNoteToBookmark,
  deleteNoteFromBookmark,
  updateNoteInBookmark,
  type Bookmark,
  type Note
} from '@/lib/storage'
import { fetchURLMetadata } from '@/lib/metadata'
import { format } from 'date-fns'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Pencil, X, Plus, Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react'

interface EditBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  bookmark: Bookmark | null
}

export function EditBookmarkDialog({
  open,
  onOpenChange,
  onSuccess,
  bookmark,
}: EditBookmarkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [currentNoteInput, setCurrentNoteInput] = useState('')
  const [showOlderNotes, setShowOlderNotes] = useState(false)
  const [localNotes, setLocalNotes] = useState<Note[]>([])
  const [showMetaDescription, setShowMetaDescription] = useState(true)

  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')

  useEffect(() => {
    if (open && bookmark) {
      setTitle(bookmark.title)
      setImageUrl(bookmark.image_url)
      setTextContent(bookmark.summary || '')
      setSelectedCategories([...bookmark.categories])
      setLocalNotes([...bookmark.notes])
      setShowMetaDescription(bookmark.show_meta_description ?? true)
      setAvailableCategories(getCategories())
      setError('')
      setShowOlderNotes(false)
    }
  }, [open, bookmark])

  const handleClose = () => {
    setCategoryInput('')
    setShowCategoryDropdown(false)
    setCurrentNoteInput('')
    setEditingNoteId(null)
    setEditingNoteContent('')
    onOpenChange(false)
  }

  const handleRefetchMetadata = async () => {
    if (!bookmark?.url) return

    setFetchingMetadata(true)
    setError('')

    try {
      const metadata = await fetchURLMetadata(bookmark.url)
      setTitle(metadata.title)
      if (metadata.image) setImageUrl(metadata.image)
    } catch (err) {
      setError('Failed to fetch metadata')
      console.error('Failed to fetch metadata:', err)
    } finally {
      setFetchingMetadata(false)
    }
  }

  const handleRefetchTitle = async () => {
    if (!bookmark?.url) return

    setFetchingMetadata(true)
    try {
      const metadata = await fetchURLMetadata(bookmark.url)
      setTitle(metadata.title)
    } catch (err) {
      console.error('Failed to fetch title:', err)
    } finally {
      setFetchingMetadata(false)
    }
  }

  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category))
  }

  const handleSelectCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category])
      setCategoryInput('')
      setShowCategoryDropdown(false)
    }
  }

  const handleAddNewCategory = () => {
    const trimmed = categoryInput.trim()
    if (trimmed && !selectedCategories.includes(trimmed)) {
      setSelectedCategories([...selectedCategories, trimmed])
      if (!availableCategories.includes(trimmed)) {
        addCategory(trimmed)
        setAvailableCategories([...availableCategories, trimmed])
      }
      setCategoryInput('')
      setShowCategoryDropdown(false)
    }
  }

  const filteredCategories = availableCategories.filter(cat =>
    !selectedCategories.includes(cat) &&
    cat.toLowerCase().includes(categoryInput.toLowerCase())
  )

  const handleAddNote = () => {
    if (!bookmark) return
    const trimmed = currentNoteInput.trim()
    if (trimmed) {
      const newNote = addNoteToBookmark(bookmark.id, trimmed)
      setLocalNotes([newNote, ...localNotes])
      setCurrentNoteInput('')
      onSuccess()
    }
  }

  const handleDeleteNote = (noteId: string) => {
    if (!bookmark) return
    if (confirm('Delete this note?')) {
      deleteNoteFromBookmark(bookmark.id, noteId)
      setLocalNotes(localNotes.filter(n => n.id !== noteId))
      onSuccess()
    }
  }

  const handleStartEditNote = (note: Note) => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }

  const handleSaveNoteEdit = () => {
    if (!bookmark || !editingNoteId) return
    const trimmed = editingNoteContent.trim()
    if (trimmed) {
      updateNoteInBookmark(bookmark.id, editingNoteId, trimmed)
      setLocalNotes(localNotes.map(n =>
        n.id === editingNoteId ? { ...n, content: trimmed } : n
      ))
      setEditingNoteId(null)
      setEditingNoteContent('')
      onSuccess()
    }
  }

  const handleCancelNoteEdit = () => {
    setEditingNoteId(null)
    setEditingNoteContent('')
  }

  const handleSave = async () => {
    if (!bookmark) return

    // Only validate title for regular link bookmarks
    // Text bookmarks and image bookmarks can have empty titles
    const isTextBookmark = !bookmark.url
    const isImageBookmark = bookmark.type === 'image'

    if (!title.trim() && !isTextBookmark && !isImageBookmark) {
      // For regular link bookmarks, auto-refetch title if empty
      if (bookmark.url) {
        await handleRefetchTitle()
        return
      }
      setError('Title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      selectedCategories.forEach(cat => addCategory(cat))

      const updates: Partial<Bookmark> = {
        title: title.trim(),
        categories: selectedCategories,
        image_url: imageUrl,
        show_meta_description: showMetaDescription,
      }

      // For text bookmarks, also update summary (text content)
      if (!bookmark.url) {
        updates.summary = textContent.trim()
      }

      updateBookmark(bookmark.id, updates)

      handleClose()
      onSuccess()
    } catch (err) {
      setError('Failed to update bookmark')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!bookmark) return null

  const visibleNotes = showOlderNotes ? localNotes : localNotes.slice(0, 3)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="edit-bookmark-dialog w-[600px] max-w-[95vw] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Bookmark</DialogTitle>
          <DialogDescription className="text-base">
            Update your bookmark details
          </DialogDescription>
        </DialogHeader>

        <div className="edit-bookmark-form space-y-4 mt-4">
          {error && (
            <div className="error-message bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Image Section */}
          {imageUrl && (
            <div className="image-section space-y-2">
              <label className="text-sm font-medium">Featured Image</label>
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-36 object-cover rounded-lg border border-gray-300"
                  onError={() => setImageUrl(null)}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {bookmark.url && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleRefetchMetadata}
                      disabled={fetchingMetadata}
                    >
                      <RefreshCw className={`w-3 h-3 ${fetchingMetadata ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setImageUrl(null)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Title Section */}
          <div className="title-section space-y-2">
            <label htmlFor="edit-title" className="text-sm font-medium flex items-center gap-2">
              <Pencil className="w-3 h-3" />
              Title {(!bookmark.url || bookmark.type === 'image') && '(optional)'}
            </label>
            <div className="flex gap-2">
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="flex-1"
                placeholder={!bookmark.url || bookmark.type === 'image' ? "Optional title..." : "Enter title"}
              />
              {bookmark.url && bookmark.type !== 'image' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefetchTitle}
                  disabled={fetchingMetadata}
                  title="Refetch title from URL"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingMetadata ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            {!title.trim() && bookmark.url && bookmark.type !== 'image' && (
              <p className="text-xs text-muted-foreground">
                Leave empty and save to auto-fetch from URL
              </p>
            )}
          </div>

          {/* Text Content Section (for text bookmarks) */}
          {!bookmark.url && (
            <div className="text-content-section space-y-2">
              <label className="text-sm font-medium">Text Content</label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={loading}
                rows={8}
                className="text-sm bg-yellow-50 border-yellow-200 focus:border-yellow-400"
                placeholder="Enter your text content..."
              />
            </div>
          )}

          {/* Meta Description Section */}
          {bookmark.meta_description && (
            <div className="meta-description-section space-y-2">
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-gray-600 italic leading-relaxed p-3 bg-gray-50 rounded-lg border border-gray-200">
                {bookmark.meta_description}
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-meta-desc-edit"
                  checked={showMetaDescription}
                  onCheckedChange={(checked) => setShowMetaDescription(checked as boolean)}
                />
                <label
                  htmlFor="show-meta-desc-edit"
                  className="text-xs text-gray-600 cursor-pointer"
                >
                  Show description in bookmark card
                </label>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="notes-section space-y-2">
            <label className="text-sm font-medium">Notes</label>

            <Textarea
              placeholder="Add a new note..."
              value={currentNoteInput}
              onChange={(e) => setCurrentNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleAddNote()
                }
              }}
              disabled={loading}
              rows={3}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Press Ctrl+Enter to add</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddNote}
                disabled={loading || !currentNoteInput.trim()}
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Note
              </Button>
            </div>

            {localNotes.length > 0 && (
              <div className="notes-list space-y-2 mt-4">
                {visibleNotes.map((note) => (
                  <div key={note.id} className="note-item bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveNoteEdit}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelNoteEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm text-gray-800">{note.content}</p>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditNote(note)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit note"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500">
                          {format(new Date(note.created_at), 'MMM d, yy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {localNotes.length > 3 && !showOlderNotes && (
                  <button
                    type="button"
                    onClick={() => setShowOlderNotes(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + {localNotes.length - 3} older notes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="categories-field space-y-2">
            <label className="text-sm font-medium">Categories</label>

            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedCategories.map((cat) => (
                  <div key={cat} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {cat}
                    <button
                      onClick={() => handleRemoveCategory(cat)}
                      className="hover:text-purple-900"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Type to filter or add category..."
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value)
                    setShowCategoryDropdown(true)
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddNewCategory()
                    }
                  }}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNewCategory}
                  disabled={loading || !categoryInput.trim()}
                >
                  Add Category
                </Button>
              </div>

              {showCategoryDropdown && filteredCategories.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectCategory(cat)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
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
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
