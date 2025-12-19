# Subfolder Migration Instructions

## Overview
This update adds unlimited nested subfolder support to your BookSmart app. Folders can now have subfolders at any depth level.

## Database Migration Required

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/003_add_subfolder_support.sql`
6. Click **Run**

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## Migration SQL
The migration adds:
- `parent_folder_id` column to folders table (nullable, references folders)
- Cascading delete (when parent folder is deleted, subfolders are deleted)
- Performance indexes for hierarchy queries

## What's New

### Sidebar
- **Recursive folder tree** with expand/collapse toggles
- **Auto-expand top-level folders** when you click a board
- **Manual expand for subfolders** (click chevron icon)
- **+ button on each folder** to create subfolders
- **Compact design** with reduced padding
- **Max height with scroll** for long folder lists
- **Indentation** shows folder depth visually

### Main Content Area
- **Hierarchical navigation**: Shows only current folder level
- **Root view**: Displays top-level folders only
- **Folder view**: Shows direct children subfolders
- **Breadcrumbs**: Board name → Folder name (clickable to navigate back)

### Features
- **Unlimited nesting**: Create folders within folders, as deep as you want
- **Drag-free organization**: Click folder icon to navigate in/out
- **Visual hierarchy**: Indentation and icons show structure
- **Bookmark filtering**: Works at any folder level

## Backward Compatibility

✅ **Your current deployment is SAFE**
- Old builds will show all folders flat (no hierarchy)
- No data will be lost
- Migration is non-breaking (adds nullable column)
- After migration, rebuild and redeploy to see subfolder features

## Testing Locally

1. Apply the migration (see above)
2. Run `npm run dev` in `apps/web`
3. Create a folder, then hover over it in the sidebar
4. Click the **+** button to create a subfolder
5. Test navigation by clicking folders

## Deploy Checklist

- [ ] Apply database migration in Supabase
- [ ] Rebuild app locally with real .env credentials: `npm run build`
- [ ] Test subfolders work correctly
- [ ] Deploy new `dist/` folder to hosting
- [ ] Verify breadcrumbs and folder navigation work

## Questions?

If you have any issues with the migration, check:
1. Supabase SQL editor for error messages
2. Browser console for JavaScript errors
3. Network tab to verify parent_folder_id is being sent to database
