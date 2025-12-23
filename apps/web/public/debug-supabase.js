// Debug helper to check Supabase database for browser bookmark import
// Run this in the browser console after import

import { supabase } from '../src/lib/supabase.js'

async function debugBrowserBookmarks() {
  console.log('=== BROWSER BOOKMARK IMPORT DEBUG (SUPABASE) ===')

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Not authenticated:', userError)
      return
    }

    console.log('✅ User authenticated:', user.email)

    // Get all boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (boardsError) {
      console.error('❌ Error fetching boards:', boardsError)
      return
    }

    console.log(`\n📁 Found ${boards?.length || 0} boards:`)
    boards?.forEach(board => {
      console.log(`  - ${board.name} (ID: ${board.id})`)
    })

    // Find Browser Bookmarks board
    const browserBookmarksBoard = boards?.find(b => b.name === 'Browser Bookmarks')

    if (!browserBookmarksBoard) {
      console.warn('⚠️ No "Browser Bookmarks" board found')
      return
    }

    console.log(`\n✅ Browser Bookmarks board found: ${browserBookmarksBoard.id}`)

    // Get folders for this board
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .eq('board_id', browserBookmarksBoard.id)
      .order('created_at', { ascending: true })

    if (foldersError) {
      console.error('❌ Error fetching folders:', foldersError)
      return
    }

    console.log(`\n📂 Found ${folders?.length || 0} folders in Browser Bookmarks board`)

    // Group folders by parent
    const foldersByParent = {}
    folders?.forEach(folder => {
      const parentId = folder.parent_folder_id || 'root'
      if (!foldersByParent[parentId]) foldersByParent[parentId] = []
      foldersByParent[parentId].push(folder)
    })

    console.log('\nFolder structure:')
    Object.entries(foldersByParent).forEach(([parentId, folderList]) => {
      const parentName = parentId === 'root' ? 'Root' : folders?.find(f => f.id === parentId)?.name || 'Unknown'
      console.log(`  ${parentName}:`)
      folderList.forEach(f => console.log(`    - ${f.name} (ID: ${f.id})`))
    })

    // Get bookmarks for this board
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('board_id', browserBookmarksBoard.id)
      .order('created_at', { ascending: false })

    if (bookmarksError) {
      console.error('❌ Error fetching bookmarks:', bookmarksError)
      return
    }

    console.log(`\n🔖 Found ${bookmarks?.length || 0} bookmarks in Browser Bookmarks board`)

    // Group bookmarks by folder
    const bookmarksByFolder = {}
    bookmarks?.forEach(bm => {
      const folderId = bm.folder_id || 'root'
      if (!bookmarksByFolder[folderId]) bookmarksByFolder[folderId] = []
      bookmarksByFolder[folderId].push(bm)
    })

    console.log('\nBookmarks per folder:')
    Object.entries(bookmarksByFolder).forEach(([folderId, bms]) => {
      const folderName = folderId === 'root' ? 'Root' : folders?.find(f => f.id === folderId)?.name || 'Unknown Folder'
      console.log(`  📁 ${folderName}: ${bms.length} bookmarks`)

      // Show first 3 bookmarks in each folder
      bms.slice(0, 3).forEach(bm => {
        console.log(`    - ${bm.title}`)
      })
      if (bms.length > 3) {
        console.log(`    ... and ${bms.length - 3} more`)
      }
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
  }

  console.log('\n=== END DEBUG ===')
}

// Run the debug
debugBrowserBookmarks()
