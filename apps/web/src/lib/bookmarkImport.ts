// Parse and import browser bookmark HTML files

import { fetchURLMetadata } from './metadata'

export interface ParsedBookmark {
  title: string
  url: string
  folder: string[]
  addDate?: number
}

export interface ImportProgress {
  total: number
  processed: number
  current: string
}

/**
 * Parse HTML bookmark file exported from browsers
 * Supports Chrome, Firefox, Edge, Safari export formats
 */
export function parseBookmarkHTML(html: string): ParsedBookmark[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const bookmarks: ParsedBookmark[] = []

  // Common top-level folder names that should be skipped
  const skipFolders = new Set([
    'Bookmarks bar',
    'Bookmarks Bar',
    'Other bookmarks',
    'Other Bookmarks',
    'Bookmarks Menu',
    'Mobile Bookmarks',
    'Personal Toolbar',
    'Unsorted Bookmarks'
  ])

  // Recursive function to traverse bookmark tree
  function traverseBookmarks(element: Element, folderPath: string[] = [], isTopLevel = false) {
    const children = Array.from(element.children)

    for (const child of children) {
      // DT (Definition Term) contains either a folder (H3) or bookmark (A)
      if (child.tagName === 'DT') {
        const h3 = child.querySelector('H3')
        const a = child.querySelector('A')

        if (h3) {
          // This is a folder
          const folderName = h3.textContent?.trim() || 'Unnamed Folder'
          const dl = child.querySelector('DL')

          if (dl) {
            // Skip top-level browser folders, but process their contents
            if (isTopLevel && skipFolders.has(folderName)) {
              // Process contents without adding this folder to the path
              traverseBookmarks(dl, folderPath, false)
            } else {
              // Recursively process bookmarks in this folder
              traverseBookmarks(dl, [...folderPath, folderName], false)
            }
          }
        } else if (a) {
          // This is a bookmark
          const url = a.getAttribute('HREF') || a.getAttribute('href')
          const title = a.textContent?.trim() || 'Untitled'
          const addDate = a.getAttribute('ADD_DATE')

          if (url && url.startsWith('http')) {
            bookmarks.push({
              title,
              url,
              folder: folderPath,
              addDate: addDate ? parseInt(addDate) * 1000 : undefined
            })
          }
        }
      } else if (child.tagName === 'DL') {
        // Direct DL element (shouldn't normally happen but handle it)
        traverseBookmarks(child, folderPath, isTopLevel)
      }
    }
  }

  // Start traversal from the document body
  const rootDL = doc.querySelector('DL')
  if (rootDL) {
    traverseBookmarks(rootDL, [], true)
  }

  console.log(`Parsed ${bookmarks.length} bookmarks with folder structure:`, bookmarks.slice(0, 5))

  return bookmarks
}

/**
 * Import browser bookmarks with metadata fetching
 * Returns a promise that resolves with import results
 */
export async function importBrowserBookmarks(
  parsedBookmarks: ParsedBookmark[],
  onProgress?: (progress: ImportProgress) => void
): Promise<{
  bookmarks: Array<{
    title: string
    url: string
    folder: string[]
    metadata: Awaited<ReturnType<typeof fetchURLMetadata>>
  }>
  errors: Array<{ url: string; error: string }>
}> {
  const results: Array<{
    title: string
    url: string
    folder: string[]
    metadata: Awaited<ReturnType<typeof fetchURLMetadata>>
  }> = []
  const errors: Array<{ url: string; error: string }> = []

  const total = parsedBookmarks.length

  // Process bookmarks in batches to avoid overwhelming the server
  const BATCH_SIZE = 5

  for (let i = 0; i < parsedBookmarks.length; i += BATCH_SIZE) {
    const batch = parsedBookmarks.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (bookmark) => {
        onProgress?.({
          total,
          processed: i + batch.indexOf(bookmark),
          current: bookmark.title
        })

        try {
          const metadata = await fetchURLMetadata(bookmark.url)

          results.push({
            title: bookmark.title,
            url: bookmark.url,
            folder: bookmark.folder,
            metadata
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.warn(`⚠️ Metadata fetch failed for ${bookmark.url}: ${errorMessage}. Importing with basic info.`)

          // Import bookmark anyway with basic info (no metadata)
          results.push({
            title: bookmark.title,
            url: bookmark.url,
            folder: bookmark.folder,
            metadata: {
              title: bookmark.title,
              description: '',
              image: null,
              favicon: null
            }
          })

          errors.push({
            url: bookmark.url,
            error: errorMessage
          })
        }
      })
    )

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < parsedBookmarks.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  onProgress?.({
    total,
    processed: total,
    current: 'Complete'
  })

  console.log(`✅ Successfully fetched metadata for ${results.length}/${total} bookmarks`)
  if (errors.length > 0) {
    console.log(`⚠️ Failed to fetch ${errors.length} bookmarks:`, errors.slice(0, 10))
  }

  return { bookmarks: results, errors }
}
