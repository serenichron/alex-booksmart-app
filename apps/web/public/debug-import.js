// Browser Bookmark Import Debug Helper
// Run this in console after import to see what happened

console.log('=== BROWSER BOOKMARK IMPORT DEBUG ===');

// Check localStorage for logs
const logs = localStorage.getItem('bookmark_import_log');
const summary = localStorage.getItem('import_summary');

if (logs) {
  console.log('\n📋 Import Logs:');
  JSON.parse(logs).forEach(log => console.log(log));
} else {
  console.log('⚠️ No import logs found in localStorage');
}

if (summary) {
  console.log('\n📊 Import Summary:');
  console.log(JSON.parse(summary));
} else {
  console.log('⚠️ No import summary found in localStorage');
}

// Check all boards
console.log('\n📁 All Boards:');
const boards = JSON.parse(localStorage.getItem('boards') || '[]');
boards.forEach(board => {
  console.log(`  - ${board.name} (ID: ${board.id})`);
});

// Check all bookmarks
console.log('\n🔖 All Bookmarks by Board:');
const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
const byBoard = {};
bookmarks.forEach(bm => {
  const boardId = bm.board_id || 'no-board';
  if (!byBoard[boardId]) byBoard[boardId] = [];
  byBoard[boardId].push(bm);
});

Object.entries(byBoard).forEach(([boardId, bms]) => {
  const board = boards.find(b => b.id === boardId);
  const boardName = board ? board.name : 'Unknown';
  console.log(`  📦 ${boardName} (${boardId}): ${bms.length} bookmarks`);

  // Group by folder
  const byFolder = {};
  bms.forEach(bm => {
    const folderId = bm.folder_id || 'root';
    if (!byFolder[folderId]) byFolder[folderId] = [];
    byFolder[folderId].push(bm);
  });

  Object.entries(byFolder).forEach(([folderId, folderBms]) => {
    console.log(`    📁 Folder ${folderId}: ${folderBms.length} bookmarks`);
  });
});

console.log('\n=== END DEBUG ===');
