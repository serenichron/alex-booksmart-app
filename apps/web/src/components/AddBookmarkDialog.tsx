import { useState, useEffect, useRef } from 'react'
import { saveBookmark, getCategories, addCategory, getBookmarks, updateBookmark, type Note, type TodoItem } from '@/lib/storage'
import { fetchURLMetadata } from '@/lib/metadata'
import { normalizeUrl, isImageUrl } from '@/lib/urlUtils'
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
import { Loader2, Link as LinkIcon, FileText, Pencil, X, Plus, Trash2, CheckSquare } from 'lucide-react'

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
  const [mode, setMode] = useState<'url' | 'text' | 'todo'>('url')
  const [loading, setLoading] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [error, setError] = useState('')

  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState<Omit<Note, 'id' | 'created_at'>[]>([])
  const [currentNoteInput, setCurrentNoteInput] = useState('')
  const [textContent, setTextContent] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [todoTitle, setTodoTitle] = useState('')
  const [todoItemsInput, setTodoItemsInput] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [duplicateBookmark, setDuplicateBookmark] = useState<any>(null)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  // Auto-fetched metadata
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [showMetaDescription, setShowMetaDescription] = useState(true)
  const [titleEdited, setTitleEdited] = useState(false)

  const fetchTimeoutRef = useRef<NodeJS.Timeout>()
  const lastFetchedUrlRef = useRef<string>('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      const categories = await getCategories()
      setAvailableCategories(categories)
    }
    if (open) {
      loadCategories()
    }
  }, [open])

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

  const reset = () => {
    setMode('url')
    setUrl('')
    setNotes([])
    setCurrentNoteInput('')
    setTextContent('')
    setTextTitle('')
    setTodoTitle('')
    setTodoItemsInput('')
    setTitle('')
    setImageUrl('')
    setMetaDescription('')
    setShowMetaDescription(true)
    setTitleEdited(false)
    setSelectedCategories([])
    setCategoryInput('')
    setShowCategoryDropdown(false)
    setError('')
    setLoading(false)
    setFetchingMetadata(false)
    setDuplicateBookmark(null)
    setShowDuplicateDialog(false)
    lastFetchedUrlRef.current = ''
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
  }

  const handleAddNote = () => {
    const trimmed = currentNoteInput.trim()
    if (trimmed) {
      setNotes([...notes, { content: trimmed }])
      setCurrentNoteInput('')
    }
  }

  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index))
  }

  const handleTodoItemsChange = (value: string) => {
    // Automatically add bullet points to each line
    const lines = value.split('\n')
    const formattedLines = lines.map((line, index) => {
      // Skip adding bullet if line is empty or already has one
      if (line.trim() === '') return line
      if (line.trim().match(/^[•\-\*]\s/)) return line
      // Only add bullet to the current line being typed (last line)
      if (index === lines.length - 1 && !line.startsWith('• ')) {
        return '• ' + line
      }
      return line
    })
    setTodoItemsInput(formattedLines.join('\n'))
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

    // Normalize and check for complete URL
    const normalizedUrl = normalizeUrl(newUrl)
    const urlPattern = /^https?:\/\/[^\s]+\.[^\s]+$/

    if (urlPattern.test(normalizedUrl)) {
      // Check if it's an image URL
      if (isImageUrl(normalizedUrl)) {
        // For image URLs, set the image directly and keep title empty
        setImageUrl(normalizedUrl)
        setTitle('')
        setMetaDescription('')
        setTitleEdited(false)
        lastFetchedUrlRef.current = normalizedUrl
      } else {
        // Debounce: wait 800ms after user stops typing for regular URLs
        fetchTimeoutRef.current = setTimeout(() => {
          fetchMetadata(normalizedUrl)
        }, 800)
      }
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

  const handleBringToTop = async () => {
    if (duplicateBookmark) {
      // Update the bookmark's created_at to now, which brings it to top
      await updateBookmark(duplicateBookmark.id, {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      setShowDuplicateDialog(false)
      handleClose()
      onSuccess()
    }
  }

  const handleSave = async () => {
    if (mode === 'url' && !url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (mode === 'text' && !textContent.trim()) {
      setError('Please enter some text')
      return
    }

    if (mode === 'todo' && !todoItemsInput.trim()) {
      setError('Please enter at least one to-do item')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Add selected categories to storage
      for (const cat of selectedCategories) {
        await addCategory(cat)
      }

      // Convert notes to proper Note objects
      const now = new Date().toISOString()
      const notesArray: Note[] = notes.map((note) => ({
        id: crypto.randomUUID(),
        content: note.content,
        created_at: now
      }))

      if (mode === 'url') {
        // Normalize URL
        const normalizedUrl = normalizeUrl(url.trim())

        // Check for duplicate
        const existingBookmarks = await getBookmarks()
        const duplicate = existingBookmarks.find(b => b.url === normalizedUrl)

        if (duplicate) {
          setDuplicateBookmark(duplicate)
          setShowDuplicateDialog(true)
          setLoading(false)
          return
        }

        // Detect if it's an image URL
        const bookmarkType = isImageUrl(normalizedUrl) ? 'image' : 'link'

        // Determine title based on bookmark type
        let bookmarkTitle = title
        if (!bookmarkTitle) {
          if (bookmarkType === 'image') {
            // For image bookmarks, title is optional - leave empty
            bookmarkTitle = ''
          } else {
            // For regular link bookmarks, use URL as fallback
            bookmarkTitle = normalizedUrl
          }
        }

        // Save URL bookmark
        await saveBookmark({
          title: bookmarkTitle,
          summary: metaDescription || '',
          notes: notesArray,
          url: normalizedUrl,
          type: bookmarkType,
          is_favorite: false,
          categories: selectedCategories,
          tags: [],
          image_url: imageUrl || null,
          meta_description: metaDescription || null,
          show_meta_description: showMetaDescription,
        })
      } else if (mode === 'text') {
        // Save text bookmark with optional title (no auto-generation)
        const bookmarkTitle = textTitle.trim()

        await saveBookmark({
          title: bookmarkTitle,
          summary: textContent,
          notes: notesArray,
          url: null,
          type: 'text',
          is_favorite: false,
          categories: selectedCategories,
          tags: [],
          image_url: null,
          meta_description: null,
        })
      } else if (mode === 'todo') {
        // Parse todo items from textarea (each line becomes a todo item)
        const todoItems: TodoItem[] = todoItemsInput
          .split('\n')
          .map(line => line.replace(/^[•\-\*]\s*/, '').trim()) // Remove bullet points
          .filter(text => text.length > 0) // Remove empty lines
          .map(text => ({
            id: crypto.randomUUID(),
            text,
            completed: false,
            created_at: now
          }))

        await saveBookmark({
          title: todoTitle.trim(),
          summary: '',
          notes: notesArray,
          url: null,
          type: 'todo',
          is_favorite: false,
          categories: selectedCategories,
          tags: [],
          image_url: null,
          meta_description: null,
          todo_items: todoItems,
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
      <DialogContent className="add-bookmark-dialog w-[600px] max-w-[95vw] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Bookmark</DialogTitle>
          <DialogDescription className="text-base">
            Save a link, text snippet, or to-do list to your collection
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
          <Button
            type="button"
            variant={mode === 'todo' ? 'default' : 'outline'}
            onClick={() => setMode('todo')}
            className="flex-1"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            To-do
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
                    <div className="fetched-description space-y-2">
                      <label className="text-xs font-medium text-gray-600">
                        Description
                      </label>
                      <p className="text-sm text-gray-600 italic leading-relaxed">{metaDescription}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                          id="show-meta-desc"
                          checked={showMetaDescription}
                          onCheckedChange={(checked) => setShowMetaDescription(checked as boolean)}
                        />
                        <label
                          htmlFor="show-meta-desc"
                          className="text-xs text-gray-600 cursor-pointer"
                        >
                          Show description in bookmark card
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Only show notes and categories after metadata is fetched */}
              {(title || imageUrl || metaDescription) && (
              <>
              <div className="notes-field space-y-2">
                <label className="text-sm font-medium">
                  Notes (optional)
                </label>

                {notes.length > 0 && (
                  <div className="notes-list space-y-2 mb-2">
                    {notes.map((note, idx) => (
                      <div key={idx} className="note-item flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="flex-1 text-sm text-gray-800">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Add a note..."
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
                  className="bookmark-notes-input"
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
              </div>

              <div className="categories-field space-y-2">
                <label className="text-sm font-medium">
                  Categories (optional)
                </label>

                {/* Selected Categories */}
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

                {/* Autocomplete Input */}
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

                  {/* Dropdown with filtered categories */}
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
              </>
              )}
            </>
          ) : mode === 'text' ? (
            <>
              <div className="text-title-field space-y-2">
                <label htmlFor="textTitle" className="text-sm font-medium">
                  Title (optional)
                </label>
                <Input
                  id="textTitle"
                  placeholder="Optional title for your text bookmark..."
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  disabled={loading}
                  className="text-title-input"
                />
              </div>

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
                <label className="text-sm font-medium">
                  Notes (optional)
                </label>

                {notes.length > 0 && (
                  <div className="notes-list space-y-2 mb-2">
                    {notes.map((note, idx) => (
                      <div key={idx} className="note-item flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="flex-1 text-sm text-gray-800">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Add a note..."
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
                  className="bookmark-notes-input"
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
              </div>

              <div className="categories-field space-y-2">
                <label className="text-sm font-medium">
                  Categories (optional)
                </label>

                {/* Selected Categories */}
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

                {/* Autocomplete Input */}
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

                  {/* Dropdown with filtered categories */}
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
            </>
          ) : (
            <>
              {/* To-do Mode */}
              <div className="todo-title-field space-y-2">
                <label htmlFor="todoTitle" className="text-sm font-medium">
                  Title (optional)
                </label>
                <Input
                  id="todoTitle"
                  placeholder="Optional title for your to-do list..."
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  disabled={loading}
                  className="todo-title-input"
                />
              </div>

              <div className="todo-items-field space-y-2">
                <label htmlFor="todoItems" className="text-sm font-medium">
                  To-do Items *
                </label>
                <Textarea
                  id="todoItems"
                  placeholder="Enter each to-do item on a new line...&#10;Bullet points will be added automatically"
                  value={todoItemsInput}
                  onChange={(e) => handleTodoItemsChange(e.target.value)}
                  disabled={loading}
                  rows={8}
                  className="todo-items-input font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Each line will become a separate to-do item</p>
              </div>

              <div className="notes-field space-y-2">
                <label className="text-sm font-medium">
                  Notes (optional)
                </label>

                {notes.length > 0 && (
                  <div className="notes-list space-y-2 mb-2">
                    {notes.map((note, idx) => (
                      <div key={idx} className="note-item flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="flex-1 text-sm text-gray-800">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Add a note..."
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
                  className="bookmark-notes-input"
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
              </div>

              <div className="categories-field space-y-2">
                <label className="text-sm font-medium">
                  Categories (optional)
                </label>

                {/* Selected Categories */}
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

                {/* Autocomplete Input */}
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

                  {/* Dropdown with filtered categories */}
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

      {/* Duplicate Detection Dialog */}
      {showDuplicateDialog && duplicateBookmark && (
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Bookmark Already Exists</DialogTitle>
              <DialogDescription>
                This URL is already bookmarked. What would you like to do?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">{duplicateBookmark.title}</p>
                <p className="text-xs text-gray-600 truncate">{duplicateBookmark.url}</p>
                {duplicateBookmark.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {duplicateBookmark.categories.map((cat: string, idx: number) => (
                      <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDuplicateDialog(false)
                  setDuplicateBookmark(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDuplicateDialog(false)
                  setDuplicateBookmark(null)
                  // Scroll to the bookmark in the dashboard
                  handleClose()
                }}
              >
                View Existing
              </Button>
              <Button
                onClick={handleBringToTop}
              >
                Bring to Top
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
