import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { AddBookmarkDialog } from '@/components/AddBookmarkDialog'
import { EditBookmarkDialog } from '@/components/EditBookmarkDialog'
import { NoteDialog } from '@/components/NoteDialog'
import { BoardManagementDialog } from '@/components/BoardManagementDialog'
import { FolderManagementDialog } from '@/components/FolderManagementDialog'
import { ImageViewerDialog } from '@/components/ImageViewerDialog'
import { Bookmark, Plus, Search, Sparkles, ExternalLink, Heart, Clock, Trash2, Pencil, Share2, Link as LinkIcon, FileText, Image as ImageIcon, Filter, X, CheckSquare, Edit, Layers, MessageSquare, Download, Upload, AlertTriangle, LogOut, Folder, FolderOpen, ChevronRight, ChevronDown, Moon, Sun } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  getBookmarks,
  getStats,
  deleteBookmark,
  toggleTodoItem,
  getBoards,
  getCurrentBoardId,
  setCurrentBoardId,
  deleteBoard,
  getFolders,
  getCurrentFolderId,
  setCurrentFolderId,
  deleteFolder,
  exportAllData,
  importAllData,
  clearAllData,
  prefetchBoard,
  type Bookmark as BookmarkType,
  type Note,
  type Board,
  type Folder as FolderType
} from '@/lib/storage'

interface BookmarkWithDetails extends BookmarkType {}

type BookmarkTypeFilter = 'text' | 'link' | 'image' | 'todo'
type SearchMode = 'board' | 'global'

export function Dashboard() {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedNoteBookmarkId, setSelectedNoteBookmarkId] = useState<string>('')
  const [expandedNotesBookmarks, setExpandedNotesBookmarks] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<BookmarkWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    tags: 0,
    thisWeek: 0,
  })
  const [selectedTypes, setSelectedTypes] = useState<Set<BookmarkTypeFilter>>(new Set(['text', 'link', 'image', 'todo']))
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>('board')

  // Board management state
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoardId, setCurrentBoardIdState] = useState<string | null>(null)
  const [showBoardDialog, setShowBoardDialog] = useState(false)
  const [boardDialogMode, setBoardDialogMode] = useState<'create' | 'rename'>('create')
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [viewingImageBookmark, setViewingImageBookmark] = useState<BookmarkType | null>(null)

  // Folder management state
  const [folders, setFolders] = useState<FolderType[]>([])
  const [currentFolderId, setCurrentFolderIdState] = useState<string | null>(null)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'rename'>('create')
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [parentFolderForNew, setParentFolderForNew] = useState<string | null>(null)
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const fetchBookmarks = async (skipCache = false) => {
    try {
      const bookmarksData = await getBookmarks({ skipCache }) // Force fresh data when skipCache=true
      const boardsData = await getBoards()
      const currentId = getCurrentBoardId()
      const currentFoldId = getCurrentFolderId()

      setBookmarks(bookmarksData)
      setBoards(boardsData)
      setCurrentBoardIdState(currentId)
      setCurrentFolderIdState(currentFoldId)
      setStats(await getStats())

      // Fetch folders for current board
      if (currentId) {
        const foldersData = await getFolders(currentId)
        setFolders(foldersData)
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchBoard = async (boardId: string) => {
    setCurrentBoardId(boardId)
    setCurrentFolderId(null) // Clear folder selection when switching boards
    setBookmarks([]) // Clear bookmarks immediately for instant board switch
    setFolders([]) // Clear folders
    setLoading(true)
    await fetchBookmarks()
  }

  const handleSwitchFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId)
    setCurrentFolderIdState(folderId)
  }

  const handleBoardHover = useCallback((boardId: string) => {
    // Prefetch board bookmarks on hover
    prefetchBoard(boardId)
  }, [])

  const handleCreateBoard = () => {
    setBoardDialogMode('create')
    setEditingBoard(null)
    setShowBoardDialog(true)
  }

  const handleRenameBoard = (board: Board) => {
    setBoardDialogMode('rename')
    setEditingBoard(board)
    setShowBoardDialog(true)
  }

  const handleDeleteBoard = async (boardId: string) => {
    if (boards.length <= 1) {
      alert('Cannot delete the last board')
      return
    }

    if (confirm('Are you sure you want to delete this board? All bookmarks in it will be lost.')) {
      await deleteBoard(boardId)
      await fetchBookmarks(true) // Skip cache to get fresh data
    }
  }

  const handleCreateFolder = (parentFolderId: string | null = null) => {
    // Ensure current board is expanded when creating folder
    if (currentBoardId) {
      setExpandedBoards(new Set([currentBoardId]))
    }
    // If creating subfolder, expand parent folder
    if (parentFolderId) {
      setExpandedFolders(prev => new Set([...prev, parentFolderId]))
    }
    setParentFolderForNew(parentFolderId)
    setFolderDialogMode('create')
    setEditingFolder(null)
    setShowFolderDialog(true)
  }

  const handleRenameFolder = (folder: FolderType) => {
    setFolderDialogMode('rename')
    setEditingFolder(folder)
    setShowFolderDialog(true)
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? Bookmarks will be moved to uncategorized.')) {
      await deleteFolder(folderId)
      await fetchBookmarks(true) // Skip cache to get fresh data
    }
  }

  const handleToggleBoardExpanded = (boardId: string) => {
    setExpandedBoards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(boardId)) {
        newSet.delete(boardId)
      } else {
        newSet.add(boardId)
      }
      return newSet
    })
  }

  const handleToggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  // Build folder tree structure
  interface FolderNode extends FolderType {
    children: FolderNode[]
  }

  const buildFolderTree = useCallback((allFolders: FolderType[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>()
    const rootFolders: FolderNode[] = []

    // Create nodes for all folders
    allFolders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // Build tree structure
    allFolders.forEach(folder => {
      const node = folderMap.get(folder.id)!
      if (folder.parent_folder_id && folderMap.has(folder.parent_folder_id)) {
        // Add to parent's children
        folderMap.get(folder.parent_folder_id)!.children.push(node)
      } else {
        // Root level folder
        rootFolders.push(node)
      }
    })

    return rootFolders
  }, [])

  const handleViewImage = (bookmark: BookmarkType) => {
    setViewingImageBookmark(bookmark)
    setShowImageViewer(true)
  }

  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `booksmart-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      alert('Data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        await importAllData(data)
        await fetchBookmarks(true) // Skip cache to get fresh data
        alert('Data imported successfully!')
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import data. Please check the file format.')
      }
    }
    input.click()
  }

  const handleClearAccount = async () => {
    if (confirm('⚠️ WARNING: This will delete ALL your bookmarks, boards, categories, and tags. This action cannot be undone!\n\nAre you sure you want to continue?')) {
      if (confirm('Are you ABSOLUTELY sure? This is your last chance to back out.')) {
        await clearAllData()
        await fetchBookmarks(true) // Skip cache to get fresh data
        alert('All data has been cleared.')
      }
    }
  }

  // Group bookmarks by folder and category
  const groupedByCategory = () => {
    // If a folder is selected, use simpler category grouping
    if (currentFolderId) {
      const uncategorized = filteredBookmarks.filter(b => b.categories.length === 0)
      const categorizedMap = new Map<string, BookmarkWithDetails[]>()

      filteredBookmarks.forEach(bookmark => {
        bookmark.categories.forEach(category => {
          if (!categorizedMap.has(category)) {
            categorizedMap.set(category, [])
          }
          categorizedMap.get(category)!.push(bookmark)
        })
      })

      // Sort bookmarks within each category by created_at (newest first)
      categorizedMap.forEach((bookmarks) => {
        bookmarks.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      })

      uncategorized.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      const sortedCategories = Array.from(categorizedMap.keys()).sort((catA, catB) => {
        const bookmarksA = categorizedMap.get(catA)!
        const bookmarksB = categorizedMap.get(catB)!
        const earliestA = Math.min(...bookmarksA.map(b => new Date(b.created_at).getTime()))
        const earliestB = Math.min(...bookmarksB.map(b => new Date(b.created_at).getTime()))
        return earliestA - earliestB
      })

      return { uncategorized, categorizedMap, sortedCategories, folders: [], folderMap: new Map() }
    }

    // When no folder is selected, group by folders first
    const folderMap = new Map<string, BookmarkWithDetails[]>()
    const noFolderBookmarks: BookmarkWithDetails[] = []

    // Filter folders to show only current level:
    // - If no folder selected (currentFolderId is null), show only top-level folders (parent_folder_id is null)
    // - If a folder is selected, show its direct children
    const foldersToShow = folders.filter(folder => folder.parent_folder_id === currentFolderId)

    // Initialize folderMap with folders at current level (including empty ones)
    foldersToShow.forEach(folder => {
      folderMap.set(folder.id, [])
    })

    filteredBookmarks.forEach(bookmark => {
      if (bookmark.folder_id) {
        if (!folderMap.has(bookmark.folder_id)) {
          folderMap.set(bookmark.folder_id, [])
        }
        folderMap.get(bookmark.folder_id)!.push(bookmark)
      } else {
        noFolderBookmarks.push(bookmark)
      }
    })

    // Sort bookmarks within each folder by created_at (newest first)
    folderMap.forEach((bookmarks) => {
      bookmarks.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    })

    // Group no-folder bookmarks by category
    const uncategorized = noFolderBookmarks.filter(b => b.categories.length === 0)
    const categorizedMap = new Map<string, BookmarkWithDetails[]>()

    noFolderBookmarks.forEach(bookmark => {
      bookmark.categories.forEach(category => {
        if (!categorizedMap.has(category)) {
          categorizedMap.set(category, [])
        }
        categorizedMap.get(category)!.push(bookmark)
      })
    })

    categorizedMap.forEach((bookmarks) => {
      bookmarks.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    })

    uncategorized.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const sortedCategories = Array.from(categorizedMap.keys()).sort((catA, catB) => {
      const bookmarksA = categorizedMap.get(catA)!
      const bookmarksB = categorizedMap.get(catB)!
      const earliestA = Math.min(...bookmarksA.map(b => new Date(b.created_at).getTime()))
      const earliestB = Math.min(...bookmarksB.map(b => new Date(b.created_at).getTime()))
      return earliestA - earliestB
    })

    return { uncategorized, categorizedMap, sortedCategories, folders: foldersToShow, folderMap }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this bookmark?')) {
      await deleteBookmark(id)
      await fetchBookmarks(true) // Skip cache to get fresh data
    }
  }

  const handleEdit = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark)
    setShowEditDialog(true)
  }

  const handleShare = async (bookmark: BookmarkType) => {
    if (!bookmark.url) {
      alert('This bookmark does not have a URL to share')
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: bookmark.title,
          url: bookmark.url
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(bookmark.url)
        alert('URL copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const handleNoteClick = (note: Note, bookmarkId: string) => {
    setSelectedNote(note)
    setSelectedNoteBookmarkId(bookmarkId)
    setShowNoteDialog(true)
  }

  const handleToggleOlderNotes = (bookmarkId: string) => {
    setExpandedNotesBookmarks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId)
      } else {
        newSet.add(bookmarkId)
      }
      return newSet
    })
  }

  const handleToggleTodo = async (bookmarkId: string, todoId: string) => {
    // Optimistic update: immediately update UI
    setBookmarks(prev => prev.map(bookmark => {
      if (bookmark.id === bookmarkId && bookmark.todo_items) {
        return {
          ...bookmark,
          todo_items: bookmark.todo_items.map(item =>
            item.id === todoId
              ? { ...item, completed: !item.completed }
              : item
          )
        }
      }
      return bookmark
    }))

    // Update database in background
    try {
      await toggleTodoItem(bookmarkId, todoId)
    } catch (error) {
      console.error('Failed to toggle todo:', error)
      // Revert optimistic update on error
      await fetchBookmarks(true)
    }
  }

  // Handler for dialog success callbacks - always skip cache for fresh data
  const handleDialogSuccess = async () => {
    await fetchBookmarks(true)
    // Keep current board expanded after folder operations
    if (currentBoardId) {
      setExpandedBoards(new Set([currentBoardId]))
    }
  }

  const handleToggleType = (type: BookmarkTypeFilter, checked?: boolean) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev)
      // Use the checked parameter if provided, otherwise toggle
      if (checked !== undefined) {
        if (checked) {
          newSet.add(type)
        } else {
          newSet.delete(type)
        }
      } else {
        if (newSet.has(type)) {
          newSet.delete(type)
        } else {
          newSet.add(type)
        }
      }
      return newSet
    })
  }

  const handleSelectAllTypes = () => {
    setSelectedTypes(new Set(['text', 'link', 'image', 'todo']))
  }

  const handleUnselectAllTypes = () => {
    setSelectedTypes(new Set())
  }

  // Search function with priority: URL > Title > Meta Description > Notes > Categories > Tags > Summary
  const searchBookmarks = (bookmarks: BookmarkWithDetails[], query: string): BookmarkWithDetails[] => {
    if (!query.trim()) return bookmarks

    const lowerQuery = query.toLowerCase().trim()

    // Create a map to store bookmarks with their search priority
    const bookmarkPriority = new Map<string, { bookmark: BookmarkWithDetails; priority: number }>()

    bookmarks.forEach(bookmark => {
      let priority = 0

      // Priority 1: URL match (highest)
      if (bookmark.url && bookmark.url.toLowerCase().includes(lowerQuery)) {
        priority = 1
      }
      // Priority 2: Title match
      else if (bookmark.title && bookmark.title.toLowerCase().includes(lowerQuery)) {
        priority = 2
      }
      // Priority 3: Meta description match
      else if (bookmark.meta_description && bookmark.meta_description.toLowerCase().includes(lowerQuery)) {
        priority = 3
      }
      // Priority 4: Notes match
      else if (bookmark.notes.some(note => note.content.toLowerCase().includes(lowerQuery))) {
        priority = 4
      }
      // Priority 5: Categories match
      else if (bookmark.categories.some(cat => cat.toLowerCase().includes(lowerQuery))) {
        priority = 5
      }
      // Priority 6: Tags match
      else if (bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        priority = 6
      }
      // Priority 7: Summary/text content match
      else if (bookmark.summary && bookmark.summary.toLowerCase().includes(lowerQuery)) {
        priority = 7
      }
      // Priority 8: Todo items match
      else if (bookmark.todo_items && bookmark.todo_items.some(item => item.text.toLowerCase().includes(lowerQuery))) {
        priority = 8
      }

      // Only include bookmarks that match the search
      if (priority > 0) {
        bookmarkPriority.set(bookmark.id, { bookmark, priority })
      }
    })

    // Sort by priority (lower number = higher priority)
    return Array.from(bookmarkPriority.values())
      .sort((a, b) => a.priority - b.priority)
      .map(item => item.bookmark)
  }

  // Filter bookmarks based on selected types and search query (memoized for performance)
  const filteredBookmarks = useMemo(() => {
    let filtered: BookmarkWithDetails[]

    // Board-wise search (global search not implemented in this version)
    // First filter by folder if one is selected
    let folderFiltered = bookmarks
    if (currentFolderId) {
      folderFiltered = bookmarks.filter(bookmark => bookmark.folder_id === currentFolderId)
    }

    // Then filter by type
    filtered = folderFiltered.filter(bookmark => {
      if (selectedTypes.size === 0) return false
      return selectedTypes.has(bookmark.type as BookmarkTypeFilter)
    })

    // Then apply search
    if (searchQuery.trim()) {
      filtered = searchBookmarks(filtered, searchQuery)
    }

    return filtered
  }, [bookmarks, selectedTypes, searchQuery, currentFolderId])

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchBookmarks()
      // Auto-expand current board if it has folders
      if (currentBoardId && folders.length > 0) {
        setExpandedBoards(new Set([currentBoardId]))
      }
    }
    loadInitialData()
  }, [])

  // Recursive folder tree item component
  const FolderTreeItem = ({ folderNode, level }: { folderNode: FolderNode; level: number }) => {
    const isExpanded = expandedFolders.has(folderNode.id)
    const hasChildren = folderNode.children.length > 0
    // Use inline style for dynamic indentation (16px per level)
    const indentStyle = level > 0 ? { paddingLeft: `${level * 16}px` } : {}

    return (
      <div className="space-y-0.5" style={indentStyle}>
        <div
          className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer group ${
            folderNode.id === currentFolderId
              ? 'bg-teal-50 dark:bg-teal-500/20 border border-[#0D7D81] dark:border-teal-400/50'
              : 'hover:bg-gray-100 dark:hover:bg-white/10'
          }`}
        >
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0"
            onClick={() => handleSwitchFolder(folderNode.id)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFolderExpanded(folderNode.id)
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-white/20 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            )}
            {folderNode.id === currentFolderId ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#0D7D81] dark:text-teal-400 flex-shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            )}
            <span className="text-xs text-gray-700 dark:text-gray-200 truncate">{folderNode.name}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleCreateFolder(folderNode.id)
              }}
              className="h-4 w-4 p-0 text-[#0D7D81] dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/20"
              title="New subfolder"
            >
              <Plus className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRenameFolder(folderNode)
              }}
              className="h-4 w-4 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              title="Rename folder"
            >
              <Edit className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFolder(folderNode.id)
              }}
              className="h-4 w-4 p-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
              title="Delete folder"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </Button>
          </div>
        </div>

        {/* Recursively render children */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {folderNode.children.map((childNode) => (
              <FolderTreeItem
                key={childNode.id}
                folderNode={childNode}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-container min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-sky-50 dark:from-slate-900 dark:via-cyan-900 dark:to-slate-900 relative">
      {/* Animated gradient shapes */}
      <div className="bg-blob absolute top-0 left-1/4 w-96 h-96 bg-teal-300 dark:bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob"></div>
      <div className="bg-blob absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300 dark:bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-20 animate-blob animation-delay-2000"></div>

      {/* Header - Full Width */}
      <header className="dashboard-header bg-white/80 dark:bg-slate-900/95 border-b border-gray-200 dark:border-white/20 sticky top-0 z-50 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="brand-section flex items-center gap-3">
              <div className="brand-icon flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl shadow-lg">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              <span className="brand-name text-xl font-bold text-gray-800 dark:text-white">BookSmart</span>
            </div>

            <div className="header-actions flex items-center gap-4">
              {showSearchInput ? (
                <div className="search-controls flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={searchMode === 'board' ? "Search in current board..." : "Search all boards..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-white dark:bg-white/10 border-gray-300 dark:border-white/30 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#0D7D81] dark:focus:border-cyan-400"
                    autoFocus
                  />
                  <div className="search-mode-toggle flex items-center border border-gray-300 dark:border-white/30 rounded-md overflow-hidden bg-gray-100 dark:bg-white/10">
                    <button
                      onClick={() => setSearchMode('board')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        searchMode === 'board'
                          ? 'bg-[#0D7D81] dark:bg-cyan-500 text-white'
                          : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      This Board
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-white/30" />
                    <button
                      onClick={() => setSearchMode('global')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        searchMode === 'global'
                          ? 'bg-[#0D7D81] dark:bg-cyan-500 text-white'
                          : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      All Boards
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchInput(false)
                      setSearchMode('board')
                    }}
                    className="text-gray-700 dark:text-white hover:text-teal-700 dark:hover:text-cyan-300 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowSearchInput(true)} className="text-gray-700 dark:text-white hover:text-teal-700 dark:hover:text-cyan-300 hover:bg-gray-100 dark:hover:bg-white/10">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleExport} title="Export all data" className="border-gray-300 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                <Upload className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleImport} title="Import data" className="border-gray-300 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearAccount} title="Clear all data" className="border-red-400/50 text-red-500 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-500/20">
                <AlertTriangle className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCreateFolder()} className="border-teal-500/50 dark:border-teal-400/50 text-[#0D7D81] dark:text-teal-300 hover:text-teal-700 dark:hover:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-500/20">
                <Folder className="w-4 h-4" />
                New Folder
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white border-0">
                <Plus className="w-4 h-4" />
                Add Bookmark
              </Button>
              <Button size="sm" variant="outline" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="border-gray-300 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => signOut()} title="Log out" className="border-gray-300 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Fixed Position */}
      <aside className="dashboard-sidebar fixed left-0 top-16 w-64 bg-white/80 dark:bg-slate-900/95 border-r border-gray-200 dark:border-white/20 h-[calc(100vh-4rem)] p-4 overflow-y-auto z-40 backdrop-blur-sm">
        <div className="space-y-4">
          {/* Bookmark Type Filter */}
          <div className="filter-section">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Bookmark Types</h3>

            <div className="space-y-1 mb-3">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded">
                <Checkbox
                  checked={selectedTypes.has('link')}
                  onCheckedChange={(checked) => handleToggleType('link', checked as boolean)}
                />
                <LinkIcon className="w-4 h-4 text-[#0D7D81] dark:text-cyan-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Links</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded">
                <Checkbox
                  checked={selectedTypes.has('text')}
                  onCheckedChange={(checked) => handleToggleType('text', checked as boolean)}
                />
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Text</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded">
                <Checkbox
                  checked={selectedTypes.has('image')}
                  onCheckedChange={(checked) => handleToggleType('image', checked as boolean)}
                />
                <ImageIcon className="w-4 h-4 text-[#0D7D81] dark:text-teal-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Images</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded">
                <Checkbox
                  checked={selectedTypes.has('todo')}
                  onCheckedChange={(checked) => handleToggleType('todo', checked as boolean)}
                />
                <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">To-dos</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllTypes}
                className="flex-1 text-xs border-gray-300 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnselectAllTypes}
                className="flex-1 text-xs border-gray-300 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              >
                Unselect All
              </Button>
            </div>
          </div>

          {/* Board Selector */}
          <div className="board-section pt-3 border-t border-gray-200 dark:border-white/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Boards</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateBoard}
                className="h-6 w-6 p-0 text-[#0D7D81] dark:text-cyan-300 hover:text-teal-700 dark:hover:text-cyan-200 hover:bg-gray-100 dark:hover:bg-white/10"
                title="Create new board"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-0.5">
              {boards.map((board) => {
                const boardFolders = board.id === currentBoardId ? folders : []
                const isExpanded = expandedBoards.has(board.id)

                return (
                  <div key={board.id} className="space-y-1">
                    {/* Board Row */}
                    <div
                      className={`flex items-center justify-between p-1.5 rounded group ${
                        board.id === currentBoardId && !currentFolderId
                          ? 'bg-teal-50 dark:bg-cyan-500/20 border border-[#0D7D81] dark:border-cyan-400/50'
                          : 'hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div
                        className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          if (board.id !== currentBoardId) {
                            handleSwitchBoard(board.id)
                            setExpandedBoards(new Set([board.id]))
                          } else {
                            handleSwitchFolder(null)
                          }
                        }}
                        onMouseEnter={() => handleBoardHover(board.id)}
                      >
                        {board.id === currentBoardId && boardFolders.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleBoardExpanded(board.id)
                            }}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-white/20 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                            )}
                          </button>
                        )}
                        <Layers className="w-3.5 h-3.5 text-[#0D7D81] dark:text-cyan-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{board.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (board.id !== currentBoardId) {
                              handleSwitchBoard(board.id)
                            }
                            setExpandedBoards(new Set([board.id]))
                            handleCreateFolder()
                          }}
                          className="h-5 w-5 p-0 text-[#0D7D81] dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/20"
                          title="New folder"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenameBoard(board)
                          }}
                          className="h-5 w-5 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                          title="Rename board"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {boards.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBoard(board.id)
                            }}
                            className="h-5 w-5 p-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                            title="Delete board"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Folders List (only shown for current board when expanded) */}
                    {board.id === currentBoardId && isExpanded && boardFolders.length > 0 && (
                      <div className="ml-5 max-h-96 overflow-y-auto">
                        {buildFolderTree(boardFolders).map((folderNode) => (
                          <FolderTreeItem
                            key={folderNode.id}
                            folderNode={folderNode}
                            level={0}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - With left margin for sidebar */}
      <main className="dashboard-main ml-64 px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Breadcrumbs */}
        <div className="breadcrumbs mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-[#0D7D81] dark:text-cyan-400" />
            <button
              onClick={() => handleSwitchFolder(null)}
              className={`font-semibold transition-colors ${
                currentFolderId === null
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {boards.find(b => b.id === currentBoardId)?.name || 'Board'}
            </button>
            {currentFolderId && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <Folder className="w-4 h-4 text-[#0D7D81] dark:text-cyan-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {folders.find(f => f.id === currentFolderId)?.name || 'Folder'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats - Calmer design with emphasis on numbers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="stats-card bg-white dark:bg-slate-800/40 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 border border-gray-200 dark:border-slate-700/50 hover:border-[#0D7D81] dark:hover:border-cyan-500/50">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Bookmarks</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">{stats.total}</div>
          </div>
          <div className="stats-card bg-white dark:bg-slate-800/40 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 border border-gray-200 dark:border-slate-700/50 hover:border-rose-500 dark:hover:border-rose-400/50">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categories</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">{stats.categories}</div>
          </div>
          <div className="stats-card bg-white dark:bg-slate-800/40 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 border border-gray-200 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-400/50">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Folders</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">{folders.length}</div>
          </div>
          <div className="stats-card bg-white dark:bg-slate-800/40 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 border border-gray-200 dark:border-slate-700/50 hover:border-violet-500 dark:hover:border-violet-400/50">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">This Week</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">{stats.thisWeek}</div>
          </div>
        </div>

        {/* Bookmarks */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty State - Improved design */
          <div className="empty-state bg-white dark:bg-slate-800/60 rounded-2xl p-16 text-center shadow-xl max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-cyan-500/20 dark:to-teal-500/20 rounded-2xl mb-6 shadow-inner">
              <Sparkles className="w-10 h-10 text-[#0D7D81] dark:text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Start Your Collection
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
              Save your first bookmark and organize it with categories and tags
            </p>
            <Button size="lg" onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#0D7D81] to-cyan-600 dark:from-cyan-500 dark:to-teal-600 hover:from-teal-700 hover:to-cyan-700 dark:hover:from-cyan-600 dark:hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-150 px-8 py-6 text-base">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Bookmark
            </Button>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          /* No results for current filter or search - Improved design */
          <div className="no-results bg-white dark:bg-slate-800/60 rounded-2xl p-16 text-center shadow-xl max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-cyan-500/20 dark:to-teal-500/20 rounded-2xl mb-6 shadow-inner">
              {searchQuery ? <Search className="w-10 h-10 text-[#0D7D81] dark:text-cyan-400" /> : <Filter className="w-10 h-10 text-[#0D7D81] dark:text-cyan-400" />}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              No Bookmarks Found
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No bookmarks match "${searchQuery}". Try a different search term.`
                : "No bookmarks match the selected filters. Try selecting different bookmark types."
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          /* Bookmarks Organized by Category */
          <div className="bookmarks-by-category space-y-10">
            {(() => {
              const { uncategorized, categorizedMap, sortedCategories, folders: boardFolders, folderMap } = groupedByCategory()

              const renderBookmarkCard = (bookmark: BookmarkWithDetails) => {
                const isTextBookmark = !bookmark.url && bookmark.type === 'text'
                const isImageBookmark = bookmark.type === 'image'
                const isTodoBookmark = bookmark.type === 'todo'

                // Calculate completion percentage for todos
                const todoCompletion = isTodoBookmark && bookmark.todo_items
                  ? {
                      completed: bookmark.todo_items.filter(item => item.completed).length,
                      total: bookmark.todo_items.length,
                      percentage: Math.round((bookmark.todo_items.filter(item => item.completed).length / bookmark.todo_items.length) * 100)
                    }
                  : null

                return (
                <div
                  key={bookmark.id}
                  className={`bookmark-card rounded-[0.3rem] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150 break-inside-avoid mb-6 relative group ${
                    isTodoBookmark
                      ? 'bg-[rgb(235,223,247)] dark:bg-[rgb(55,47,77)] shadow-md border border-[rgb(223,211,235)] dark:border-[rgb(89,61,93)]'
                      : isTextBookmark
                      ? 'bg-[rgb(255,255,230)] dark:bg-[rgb(60,104,70)] shadow-md border border-[rgb(241,240,175)] dark:border-[rgb(83,122,93)]'
                      : isImageBookmark
                      ? 'bg-black shadow-lg'
                      : 'bg-white dark:bg-slate-800/60 shadow-md dark:shadow-slate-900/30 border border-gray-200/60 dark:border-[rgb(66,83,108)]/50'
                  }`}
                >
                  {/* Action Buttons - Cleaner design */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    {bookmark.url && (
                      <button
                        onClick={() => window.open(bookmark.url!, '_blank')}
                        className="bg-[#0D7D81] dark:bg-cyan-500 hover:bg-teal-700 dark:hover:bg-cyan-600 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {bookmark.url && (
                      <button
                        onClick={() => handleShare(bookmark)}
                        className="bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
                        title="Share bookmark"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(bookmark)}
                      className="bg-slate-600 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
                      title="Edit bookmark"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-150"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image Bookmark - Special Design */}
                  {isImageBookmark && bookmark.url ? (
                    <div
                      className="block relative cursor-pointer"
                      onClick={() => handleViewImage(bookmark)}
                    >
                      <img
                        src={bookmark.url}
                        alt={bookmark.title}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '600px' }}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = bookmark.image_url || ''
                        }}
                      />

                      {/* Notes count badge - top left (if notes exist) */}
                      {bookmark.notes.length > 0 && (
                        <div className="absolute top-3 left-3 bg-teal-600/90 text-white px-2 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-medium z-10">
                          <MessageSquare className="w-3 h-3" />
                          {bookmark.notes.length}
                        </div>
                      )}

                      {/* Title overlay at top - only show if title exists */}
                      {bookmark.title && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent pt-[0.8rem] pb-3 px-3">
                          <h3 className="text-white font-semibold text-base line-clamp-2 drop-shadow-lg text-left">
                            {bookmark.title}
                          </h3>
                        </div>
                      )}

                      {/* Timestamps overlay at bottom - always show */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="flex items-center gap-2 text-[9px] text-white/90">
                          <div className="flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            <span className="font-medium">Created:</span> {format(new Date(bookmark.created_at), 'MMM d, yy HH:mm')}
                          </div>
                          {bookmark.updated_at && bookmark.updated_at !== bookmark.created_at && (
                            <>
                              <span className="text-white/60">•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-2 h-2" />
                                <span className="font-medium">Edited:</span> {format(new Date(bookmark.updated_at), 'MMM d, yy HH:mm')}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : bookmark.image_url && !isImageBookmark && (
                    <a
                      href={bookmark.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-image-container block border-b border-[#d3d3d3] dark:border-white/40"
                    >
                      <img
                        src={bookmark.image_url}
                        alt={bookmark.title}
                        className="bookmark-image w-full h-36 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.parentElement!.parentElement!.style.display = 'none'
                        }}
                      />
                    </a>
                  )}

                  {/* To-do Bookmark - Special Design */}
                  {isTodoBookmark ? (
                    <div className="todo-bookmark-content px-4 pt-[0.8rem] pb-0">
                      {/* Title and Completion */}
                      <div className="flex items-center justify-between mb-3">
                        {bookmark.title ? (
                          <h3 className="text-base font-bold text-gray-900 dark:text-white flex-1 leading-snug">
                            {bookmark.title}
                          </h3>
                        ) : (
                          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 flex-1 leading-snug">
                            To-do List
                          </h3>
                        )}
                        {bookmark.is_favorite && (
                          <Heart className="w-4 h-4 text-red-500 dark:text-red-400 fill-current flex-shrink-0 ml-2" />
                        )}
                      </div>

                      {/* Completion Percentage */}
                      {todoCompletion && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] text-gray-700 dark:text-gray-300 mb-1">
                            <span className="font-medium">Progress</span>
                            <span>{todoCompletion.completed}/{todoCompletion.total} ({todoCompletion.percentage}%)</span>
                          </div>
                          <div className="w-full bg-emerald-100/50 dark:bg-[rgb(135,98,148)]/20 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#0B8594] h-full transition-all duration-300 rounded-full"
                              style={{ width: `${todoCompletion.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Todo Items */}
                      {bookmark.todo_items && bookmark.todo_items.length > 0 && (
                        <div className="space-y-0.5 mb-3">
                          {bookmark.todo_items.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-2 cursor-pointer group hover:bg-emerald-100/40 dark:hover:bg-emerald-900/10 p-0.5 rounded transition-colors"
                            >
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={() => handleToggleTodo(bookmark.id, item.id)}
                                className="mt-0.5 flex-shrink-0"
                              />
                              <span
                                className={`text-xs flex-1 leading-relaxed ${
                                  item.completed
                                    ? 'text-gray-500 dark:text-gray-500 line-through'
                                    : 'text-gray-700 dark:text-gray-200'
                                }`}
                              >
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Notes for todo */}
                      {bookmark.notes.length > 0 && (
                        <div className="bookmark-notes-container mb-2 pt-2 border-t border-emerald-200/40 dark:border-slate-700/60">
                          <label className="text-[10px] font-semibold text-gray-900 dark:text-white mb-1.5 block">Notes</label>
                          <div className="space-y-1.5">
                            {(expandedNotesBookmarks.has(bookmark.id)
                              ? bookmark.notes
                              : bookmark.notes.slice(0, 3)
                            ).map((note) => (
                              <div
                                key={note.id}
                                className="bookmark-note bg-[rgba(9,163,171,0.1)] dark:bg-[rgba(9,163,171,0.1)] border-l-3 border-[#0D7D81] dark:border-cyan-400 p-2 rounded-r relative group cursor-pointer hover:shadow-sm transition-shadow"
                                onClick={() => handleNoteClick(note, bookmark.id)}
                              >
                                <p className="text-[11px] text-gray-800 dark:text-gray-200 line-clamp-3 leading-relaxed pr-1">
                                  {note.content}
                                </p>
                              </div>
                            ))}
                          </div>
                          {bookmark.notes.length > 3 && (
                            <button
                              onClick={() => handleToggleOlderNotes(bookmark.id)}
                              className="text-[10px] text-[#0D7D81] dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 mt-1.5 font-medium"
                            >
                              {expandedNotesBookmarks.has(bookmark.id)
                                ? '− Show less'
                                : `+ ${bookmark.notes.length - 3} older notes`}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Categories for todo */}
                      {bookmark.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {bookmark.categories.map((cat, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] py-0 h-5 bg-gray-200 dark:bg-slate-700/60 text-gray-900 dark:text-gray-300 border-gray-300 dark:border-slate-600/50">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Board badge in global search */}
                      {searchMode === 'global' && searchQuery.trim() && 'boardName' in bookmark && (
                        <div className="mb-2">
                          <Badge variant="outline" className="text-[10px] py-0 h-5 bg-teal-50 dark:bg-cyan-500/20 text-[#0D7D81] dark:text-cyan-200 border-[#0D7D81]/30 dark:border-cyan-400/50">
                            <Layers className="w-2.5 h-2.5 mr-1" />
                            {(bookmark as any).boardName}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : !isImageBookmark && (
                  <div className="bookmark-content px-4 pt-[0.8rem] pb-0">
                    {/* Only show title if it exists - EMPHASIZED */}
                    {bookmark.title && (
                      <div className="bookmark-header flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Favicon for URL bookmarks */}
                          {bookmark.favicon && bookmark.url && !isTextBookmark && !isTodoBookmark && (
                            <img
                              src={bookmark.favicon}
                              alt=""
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          {bookmark.url ? (
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bookmark-title text-base font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 hover:text-[#0D7D81] dark:hover:text-cyan-400 transition-colors cursor-pointer leading-snug min-w-0"
                            >
                              {bookmark.title}
                            </a>
                          ) : (
                            <h3 className="bookmark-title text-base font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 leading-snug min-w-0">
                              {bookmark.title}
                            </h3>
                          )}
                        </div>
                        {bookmark.is_favorite && (
                          <Heart className="bookmark-favorite-icon w-4 h-4 text-red-500 dark:text-red-400 fill-current flex-shrink-0 ml-2" />
                        )}
                      </div>
                    )}

                    {/* For text bookmarks, show summary (text content) when no title or when title is provided */}
                    {isTextBookmark && bookmark.summary && (
                      <p className="bookmark-text-content text-sm text-gray-800 dark:text-gray-300 mb-3 line-clamp-3 leading-relaxed">
                        {bookmark.summary}
                      </p>
                    )}

                    {/* For URL bookmarks, show meta description if enabled - MUTED */}
                    {!isTextBookmark && bookmark.meta_description && bookmark.show_meta_description !== false && (
                      <p className="bookmark-meta-description text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                        {bookmark.meta_description}
                      </p>
                    )}

                    {/* URL at bottom - SUBTLE */}
                    {bookmark.url && (
                      <div className="bookmark-url-display mb-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-[#0D7D81] dark:hover:text-cyan-400 hover:underline flex items-center gap-1 truncate leading-tight"
                        >
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{bookmark.url}</span>
                        </a>
                      </div>
                    )}

                    {bookmark.notes.length > 0 && (
                      <div className="bookmark-notes-container mb-2">
                        <label className="text-[10px] font-semibold text-gray-900 dark:text-white mb-1.5 block">Notes</label>
                        <div className="space-y-1.5">
                          {(expandedNotesBookmarks.has(bookmark.id)
                            ? bookmark.notes
                            : bookmark.notes.slice(0, 3)
                          ).map((note) => (
                            <div
                              key={note.id}
                              className="bookmark-note bg-[rgba(9,163,171,0.1)] dark:bg-[rgba(9,163,171,0.1)] border-l-3 border-[#0D7D81] dark:border-cyan-400 p-2 rounded-r relative group cursor-pointer hover:shadow-sm transition-shadow"
                              onClick={() => handleNoteClick(note, bookmark.id)}
                              title="Click to view full note"
                            >
                              <p className="bookmark-note-text text-xs text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                                {note.content}
                              </p>
                            </div>
                          ))}
                          {bookmark.notes.length > 3 && (
                            <button
                              onClick={() => handleToggleOlderNotes(bookmark.id)}
                              className="text-[10px] text-[#0D7D81] dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 font-medium"
                            >
                              {expandedNotesBookmarks.has(bookmark.id)
                                ? '- Show fewer notes'
                                : `+ ${bookmark.notes.length - 3} older notes`
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {bookmark.categories.length > 0 && (
                      <div className="bookmark-categories flex flex-wrap gap-1 mb-2">
                        {bookmark.categories.map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="bookmark-category text-[10px] py-0 h-5 bg-gray-200 dark:bg-white/20 text-gray-900 dark:text-white border-gray-300 dark:border-white/30">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {bookmark.tags.length > 0 && (
                      <div className="bookmark-tags flex flex-wrap gap-1 mb-2">
                        {bookmark.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bookmark-tag text-[10px] py-0 h-5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/30">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="outline" className="bookmark-tags-more text-[10px] py-0 h-5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/30">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Board badge in global search */}
                    {searchMode === 'global' && searchQuery.trim() && 'boardName' in bookmark && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-[10px] py-0 h-5 bg-teal-50 dark:bg-cyan-500/20 text-[#0D7D81] dark:text-cyan-200 border-[#0D7D81]/30 dark:border-cyan-400/50">
                          <Layers className="w-2.5 h-2.5 mr-1" />
                          {(bookmark as any).boardName}
                        </Badge>
                      </div>
                    )}
                  </div>
                  )}
                </div>
                )
              }

              return (
                <>
                  {/* Folder Icons Grid - Show First */}
                  {boardFolders && boardFolders.length > 0 && (
                    <>
                      <div className="folders-grid mb-16">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {boardFolders.map((folder) => {
                            const folderBookmarks = folderMap.get(folder.id) || []
                            return (
                              <div
                                key={folder.id}
                                onClick={() => handleSwitchFolder(folder.id)}
                                className={`folder-item cursor-pointer p-5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 ${
                                  folder.id === currentFolderId
                                    ? 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-cyan-900/40 dark:to-teal-900/40 shadow-lg shadow-teal-200/50 dark:shadow-cyan-900/30 ring-2 ring-[#0D7D81] dark:ring-cyan-400'
                                    : 'bg-white dark:bg-slate-800/60 shadow-md dark:shadow-slate-900/30 hover:shadow-xl hover:ring-2 hover:ring-[#0D7D81]/50 dark:hover:ring-cyan-400/50'
                                }`}
                              >
                                <div className="flex flex-col items-center text-center gap-3">
                                  <Folder className={`w-16 h-16 transition-colors ${
                                    folder.id === currentFolderId ? 'text-[#0D7D81] dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500'
                                  }`} />
                                  <div className="w-full">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={folder.name}>
                                      {folder.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {folderBookmarks.length} {folderBookmarks.length === 1 ? 'item' : 'items'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Uncategorized Section */}
                  {uncategorized.length > 0 && (
                    <>
                      <div className="category-section mb-16">
                        <div className="mb-8 pt-3 border-t-2 border-gray-300 dark:border-slate-600">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            Uncategorized
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              ({uncategorized.length})
                            </span>
                          </h2>
                        </div>
                        <div className="bookmarks-masonry columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
                          {uncategorized.map(renderBookmarkCard)}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Categorized Sections */}
                  {sortedCategories.map((category) => (
                    <div key={category} className="category-section mb-16">
                      <div className="mb-8 pt-3 border-t-2 border-gray-300 dark:border-slate-600">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                          {category}
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            ({categorizedMap.get(category)!.length})
                          </span>
                        </h2>
                      </div>
                      <div className="bookmarks-masonry columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
                        {categorizedMap.get(category)!.map(renderBookmarkCard)}
                      </div>
                    </div>
                  ))}
                </>
              )
            })()}

          </div>
        )}
      </main>

      {/* Add Bookmark Dialog */}
      <AddBookmarkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Bookmark Dialog */}
      <EditBookmarkDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleDialogSuccess}
        bookmark={editingBookmark}
      />

      {/* Note Dialog */}
      <NoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        note={selectedNote}
        bookmarkId={selectedNoteBookmarkId}
        onSuccess={handleDialogSuccess}
      />

      {/* Board Management Dialog */}
      <BoardManagementDialog
        open={showBoardDialog}
        onOpenChange={setShowBoardDialog}
        onSuccess={handleDialogSuccess}
        mode={boardDialogMode}
        board={editingBoard}
      />

      {/* Folder Management Dialog */}
      <FolderManagementDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        onSuccess={handleDialogSuccess}
        mode={folderDialogMode}
        boardId={currentBoardId || ''}
        folder={editingFolder}
        parentFolderId={parentFolderForNew}
      />

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={showImageViewer}
        onOpenChange={setShowImageViewer}
        bookmark={viewingImageBookmark}
        onEdit={handleEdit}
        onShare={handleShare}
      />

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
