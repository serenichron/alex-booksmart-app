# Browser Extension Documentation

## Overview

The BookSmart browser extension provides enhanced bookmark management capabilities that overcome limitations of the web application, particularly for accessing private/authenticated content like Google Docs, Notion pages, and other protected resources.

## Why a Browser Extension?

### Authentication & Access

**The Problem:**
- The web app uses `corsproxy.io` to fetch metadata for bookmarked URLs
- This proxy doesn't have your authentication cookies or login sessions
- Private content (Google Docs, Sheets, Notion pages, etc.) returns `401 Unauthorized`
- Results in generic fallback titles like "docs.google.com" instead of "2026 TOEFL Tests - Google Sheets"

**The Solution:**
The browser extension runs in the same context as your browser, which means:
- ✅ Has access to your authentication cookies and sessions
- ✅ Can read the page's `<title>` tag directly from loaded content
- ✅ No CORS restrictions (already in the browser)
- ✅ Can access private Google Docs, Notion pages, protected sites
- ✅ Gets accurate titles, descriptions, and metadata

### How Browsers Get Bookmark Titles

When you bookmark a page in Chrome/Firefox/Safari:
1. You're already logged into the site (Google, Notion, etc.)
2. The browser has access to the loaded page content
3. It reads the `<title>` tag directly
4. Saves the accurate title with the bookmark

The extension replicates this functionality for BookSmart.

## Key Features

### 1. Accurate Metadata Capture

**Current bookmark button (web app):**
```
URL: https://docs.google.com/spreadsheets/d/abc123/edit
Title: "docs.google.com" ❌ (metadata fetch failed)
```

**With browser extension:**
```
URL: https://docs.google.com/spreadsheets/d/abc123/edit
Title: "2026 TOEFL Tests - Extraction - Google Sheets" ✅ (read from page)
```

### 2. Direct Browser Bookmark Import

Instead of exporting an HTML file and uploading it, the extension can:
- Access browser bookmarks directly via Chrome/Firefox APIs
- Import all bookmarks with folder structure in one click
- Preserve original titles without re-fetching metadata
- No export file needed

**Web App Import Flow:**
```
Browser → Export HTML → Upload to web app → Parse → Fetch metadata → Import
```

**Extension Import Flow:**
```
Browser → One-click import → Done
```

### 3. Right-Click Context Menu

Add bookmarks from any page by:
- Right-clicking anywhere on the page
- Selecting "Save to BookSmart"
- Automatic metadata capture from current page
- Works on private/authenticated pages

### 4. Keyboard Shortcuts

Quick bookmark capture with:
- `Ctrl+Shift+B` (Windows/Linux)
- `Cmd+Shift+B` (Mac)

### 5. Native Integration

- Browser action icon shows bookmark count
- Badge notifications for new bookmarks
- Seamless integration with browser's bookmark manager

## Technical Implementation

### Metadata Extraction

```javascript
// Extension can access page directly
const metadata = {
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content,
  image: document.querySelector('meta[property="og:image"]')?.content,
  favicon: document.querySelector('link[rel="icon"]')?.href,
  url: window.location.href
}
```

### Browser Bookmarks API

```javascript
// Chrome/Firefox API access
chrome.bookmarks.getTree((bookmarkTreeNodes) => {
  // Direct access to all browser bookmarks
  // No export file needed
  // Preserves original structure and titles
})
```

### Authentication Context

The extension runs in the browser's authenticated context:
- Can access pages you're logged into
- Respects existing cookie sessions
- No additional authentication needed
- Works with SSO, 2FA, and enterprise auth

## Comparison: Web App vs Extension

| Feature | Web App | Browser Extension |
|---------|---------|-------------------|
| **Public URLs** | ✅ Full metadata | ✅ Full metadata |
| **Private Google Docs** | ❌ Generic title | ✅ Accurate title |
| **Notion Pages** | ❌ Generic title | ✅ Accurate title |
| **Protected Sites** | ❌ 401 Unauthorized | ✅ Full access |
| **Import Method** | Export HTML file | Direct API access |
| **Quick Capture** | Copy URL, paste | Right-click / shortcut |
| **Context Menu** | ❌ Not available | ✅ Available |
| **Keyboard Shortcuts** | ❌ Not available | ✅ Available |

## Planned Features

### Phase 1: Core Functionality
- [ ] Add bookmark from current page
- [ ] Accurate metadata capture (title, description, image, favicon)
- [ ] Support for authenticated content
- [ ] Right-click context menu
- [ ] Keyboard shortcuts

### Phase 2: Browser Bookmarks Integration
- [ ] Direct browser bookmark import (no export file)
- [ ] Real-time bookmark sync
- [ ] Folder structure preservation
- [ ] Bi-directional sync (BookSmart ↔ Browser)

### Phase 3: Advanced Features
- [ ] Bulk tagging from browser
- [ ] Quick search popup
- [ ] Suggested tags based on page content
- [ ] Automatic categorization using AI
- [ ] Offline bookmark access

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | Planned | Manifest V3, Chrome Extensions API |
| Firefox | Planned | WebExtensions API |
| Edge | Planned | Chromium-based, same as Chrome |
| Safari | Future | Different extension architecture |

## Privacy & Security

### Data Access
- Extension only reads page metadata when user bookmarks
- No passive tracking or data collection
- User must explicitly trigger bookmark capture

### Permissions Required
- `activeTab`: Read current page metadata
- `bookmarks`: Import browser bookmarks
- `contextMenus`: Right-click menu
- `storage`: Store extension settings

### Data Storage
- All bookmark data stored in BookSmart (Supabase)
- No local bookmark storage in extension
- Extension acts as a capture tool only

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit BookSmart extension page
2. Click "Add to Chrome"
3. Confirm permissions
4. Log in to BookSmart account

### Development Build
```bash
# Clone repository
git clone https://github.com/yourusername/booksmart

# Install dependencies
cd apps/extension
pnpm install

# Build extension
pnpm build

# Load in Chrome
1. Go to chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select dist/ folder
```

## Usage Guide

### Adding a Bookmark

**Method 1: Extension Icon**
1. Navigate to page you want to bookmark
2. Click BookSmart extension icon
3. Edit title/tags if needed
4. Select board and folder
5. Click "Save"

**Method 2: Context Menu**
1. Right-click anywhere on page
2. Select "Save to BookSmart"
3. Bookmark saved with current page metadata

**Method 3: Keyboard Shortcut**
1. Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
2. Quick-save to default board

### Importing Browser Bookmarks

**Old Way (Web App):**
1. Export bookmarks from browser
2. Go to BookSmart web app
3. Settings → Data Management
4. Import Browser Bookmarks
5. Select exported HTML file
6. Wait for import to complete

**New Way (Extension):**
1. Click extension icon
2. Click "Import Browser Bookmarks"
3. Confirm permission to access bookmarks
4. Import happens instantly
5. Folder structure preserved
6. Original titles maintained

## Troubleshooting

### Extension Can't Capture Metadata

**Issue:** Extension shows "Unable to capture metadata"

**Solutions:**
- Ensure you're on a regular web page (not `chrome://` or `about:` pages)
- Check that page has finished loading
- Verify BookSmart account is connected

### Browser Bookmarks Import Fails

**Issue:** Import shows error or no bookmarks found

**Solutions:**
- Grant bookmarks permission when prompted
- Check browser has bookmarks to import
- Try reloading extension

### Authentication Issues

**Issue:** Extension can't save bookmarks to account

**Solutions:**
- Log in to BookSmart web app first
- Check extension has valid session
- Try logging out and back in

## Development

### Project Structure
```
apps/extension/
├── manifest.json       # Extension manifest
├── src/
│   ├── background/    # Background service worker
│   ├── content/       # Content scripts
│   ├── popup/         # Extension popup UI
│   └── utils/         # Shared utilities
├── public/            # Static assets
└── dist/              # Build output
```

### API Integration

The extension communicates with BookSmart's backend:

```typescript
// Save bookmark via API
const response = await fetch('https://api.booksmart.app/bookmarks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: pageTitle,
    url: pageUrl,
    metadata: {
      description,
      image,
      favicon
    },
    board_id: selectedBoard,
    folder_id: selectedFolder
  })
})
```

## Contributing

We welcome contributions to the browser extension! Areas where help is needed:

- Cross-browser compatibility testing
- UI/UX improvements for popup interface
- Additional metadata capture strategies
- Performance optimizations
- Safari extension development

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## References

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Firefox WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Bookmarks API](https://developer.chrome.com/docs/extensions/reference/bookmarks/)
