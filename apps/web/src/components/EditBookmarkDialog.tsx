import { useState, useEffect } from 'react'
import {
  updateBookmark,
  getCategories,
  addCategory,
  addNoteToBookmark,
  deleteNoteFromBookmark,
  updateNoteInBookmark,
  addTodoItem,
  deleteTodoItem,
  updateTodoItem,
  toggleTodoItem,
  type Bookmark,
  type Note,
  type TodoItem
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
import { Loader2, Pencil, X, Plus, Trash2, RefreshCw, CheckSquare } from 'lucide-react'

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

  // Todo-specific state
  const [localTodoItems, setLocalTodoItems] = useState<TodoItem[]>([])
  const [newTodoItemInput, setNewTodoItemInput] = useState('')
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editingTodoText, setEditingTodoText] = useState('')

  useEffect(() => {
    if (open && bookmark) {
      setTitle(bookmark.title)
      setImageUrl(bookmark.image_url)
      setTextContent(bookmark.summary || '')
      setSelectedCategories([...bookmark.categories])
      setLocalNotes([...bookmark.notes])
      setLocalTodoItems([...(bookmark.todo_items || [])])
      setShowMetaDescription(bookmark.show_meta_description ?? true)
      getCategories().then(setAvailableCategories)
      setError('')
      setShowOlderNotes(false)
      setNewTodoItemInput('')
      setEditingTodoId(null)
      setEditingTodoText('')
    }
  }, [open, bookmark])

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

  const handleClose = () => {
    setCategoryInput('')
    setShowCategoryDropdown(false)
    setCurrentNoteInput('')
    setEditingNoteId(null)
    setEditingNoteContent('')
    setNewTodoItemInput('')
    setEditingTodoId(null)
    setEditingTodoText('')
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

  const handleAddNewCategory = async () => {
    const trimmed = categoryInput.trim()
    if (trimmed && !selectedCategories.includes(trimmed)) {
      setSelectedCategories([...selectedCategories, trimmed])
      if (!availableCategories.includes(trimmed)) {
        await addCategory(trimmed)
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

  const handleAddNote = async () => {
    if (!bookmark) return
    const trimmed = currentNoteInput.trim()
    if (trimmed) {
      const newNote = await addNoteToBookmark(bookmark.id, trimmed)
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

  // Todo handlers
  const handleToggleTodoItem = (todoId: string) => {
    if (!bookmark) return
    toggleTodoItem(bookmark.id, todoId)
    setLocalTodoItems(localTodoItems.map(item =>
      item.id === todoId ? { ...item, completed: !item.completed } : item
    ))
    onSuccess()
  }

  const handleAddTodoItem = async () => {
    if (!bookmark) return
    const trimmed = newTodoItemInput.trim()
    if (trimmed) {
      const newItem = await addTodoItem(bookmark.id, trimmed)
      setLocalTodoItems([...localTodoItems, newItem])
      setNewTodoItemInput('')
      onSuccess()
    }
  }

  const handleDeleteTodoItem = (todoId: string) => {
    if (!bookmark) return
    if (confirm('Delete this to-do item?')) {
      deleteTodoItem(bookmark.id, todoId)
      setLocalTodoItems(localTodoItems.filter(item => item.id !== todoId))
      onSuccess()
    }
  }

  const handleStartEditTodo = (item: TodoItem) => {
    setEditingTodoId(item.id)
    setEditingTodoText(item.text)
  }

  const handleSaveTodoEdit = () => {
    if (!bookmark || !editingTodoId) return
    const trimmed = editingTodoText.trim()
    if (trimmed) {
      updateTodoItem(bookmark.id, editingTodoId, trimmed)
      setLocalTodoItems(localTodoItems.map(item =>
        item.id === editingTodoId ? { ...item, text: trimmed } : item
      ))
      setEditingTodoId(null)
      setEditingTodoText('')
      onSuccess()
    }
  }

  const handleCancelTodoEdit = () => {
    setEditingTodoId(null)
    setEditingTodoText('')
  }

  const handleSave = async () => {
    if (!bookmark) return

    // Only validate title for regular link bookmarks
    // Text bookmarks, image bookmarks, and todo bookmarks can have empty titles
    const isTextBookmark = !bookmark.url && bookmark.type === 'text'
    const isImageBookmark = bookmark.type === 'image'
    const isTodoBookmark = bookmark.type === 'todo'

    if (!title.trim() && !isTextBookmark && !isImageBookmark && !isTodoBookmark) {
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
      for (const cat of selectedCategories) {
        await addCategory(cat)
      }

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

      await updateBookmark(bookmark.id, updates)

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
              Title {(!bookmark.url || bookmark.type === 'image' || bookmark.type === 'todo') && '(optional)'}
            </label>
            <div className="flex gap-2">
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="flex-1"
                placeholder={!bookmark.url || bookmark.type === 'image' || bookmark.type === 'todo' ? "Optional title..." : "Enter title"}
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
          {!bookmark.url && bookmark.type === 'text' && (
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

          {/* Todo Items Section (for todo bookmarks) */}
          {bookmark.type === 'todo' && (
            <div className="todo-items-section space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                To-do Items
              </label>

              {/* Add new todo item */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add new to-do item..."
                  value={newTodoItemInput}
                  onChange={(e) => setNewTodoItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTodoItem()
                    }
                  }}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddTodoItem}
                  disabled={loading || !newTodoItemInput.trim()}
                  className="h-10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Todo items list */}
              {localTodoItems.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto p-3 bg-purple-50/50 rounded-lg border border-purple-200">
                  {localTodoItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 bg-white p-2.5 rounded border border-purple-100 group">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleTodoItem(item.id)}
                        className="mt-0.5 flex-shrink-0"
                      />
                      {editingTodoId === item.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editingTodoText}
                            onChange={(e) => setEditingTodoText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveTodoEdit()
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                handleCancelTodoEdit()
                              }
                            }}
                            className="flex-1 text-sm"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveTodoEdit}
                            className="h-8"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelTodoEdit}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`flex-1 text-sm leading-relaxed ${
                              item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                            }`}
                          >
                            {item.text}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => handleStartEditTodo(item)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title="Edit item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodoItem(item.id)}
                              className="p-1 text-gray-500 hover:text-red-600"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Completion stats */}
              {localTodoItems.length > 0 && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">
                    {localTodoItems.filter(item => item.completed).length} of {localTodoItems.length} completed
                  </span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span>
                    {Math.round((localTodoItems.filter(item => item.completed).length / localTodoItems.length) * 100)}% done
                  </span>
                </div>
              )}
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

        {/* Timestamp Information */}
        {bookmark && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span className="font-medium">Created:</span>
                <span>{format(new Date(bookmark.created_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              {bookmark.updated_at && bookmark.updated_at !== bookmark.created_at && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Last edited:</span>
                    <span>{format(new Date(bookmark.updated_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
