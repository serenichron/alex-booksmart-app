# Database Setup Guide

## Step 1: Run the Migration

1. **Open your Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to your project**: Click on "alex-via-tr" (or whatever you named it)
3. **Open SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "New query"
4. **Copy & paste the SQL**:
   - Open `migrations/001_initial_schema.sql`
   - Copy ALL the content
   - Paste into the SQL Editor
5. **Run it**: Click "Run" button (or press Cmd/Ctrl + Enter)

You should see: "Success. No rows returned"

## Step 2: Verify Tables Created

1. **Go to Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ profiles
   - ✅ workspaces
   - ✅ categories
   - ✅ tags
   - ✅ bookmarks
   - ✅ bookmark_categories
   - ✅ bookmark_tags
   - ✅ connections

## What This Does

The migration creates:
- **7 main tables** for storing your bookmark data
- **Security policies** (users can only see their own data)
- **Automatic triggers** (creates profile + default workspace on signup)
- **Vector search** (for AI similarity matching)
- **Indexes** (for fast queries)

## If Something Goes Wrong

If you see errors, you can reset:
1. Go to "Database" → "Tables"
2. Delete all tables starting with these names
3. Run the migration again

---

✅ Once done, come back and I'll continue building the app!
