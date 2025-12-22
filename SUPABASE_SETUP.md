# Supabase Setup Instructions

## Running the Profiles Table Migration

To fix the "Could not find the 'first_name' column" error, you need to create the `profiles` table in your Supabase database.

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/create_profiles_table.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify the Table**
   - Go to "Table Editor" in the left sidebar
   - You should now see a `profiles` table
   - The table should have these columns:
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to auth.users)
     - `first_name` (text, nullable)
     - `last_name` (text, nullable)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

### What This Migration Does:

✅ Creates the `profiles` table with proper schema
✅ Sets up Row Level Security (RLS) policies
✅ Adds indexes for better performance
✅ Creates auto-update trigger for `updated_at`
✅ Grants proper permissions to authenticated users

### After Running the Migration:

- New signups will automatically create a profile with first/last name
- Existing users can add their names in User Settings
- The "Save Profile" button will work without errors
- User avatar will show the first initial of the first name

## Troubleshooting

**If you get an error about policies already existing:**
- This is fine! It means the table was partially created
- You can safely ignore those specific errors

**If you get permission errors:**
- Make sure you're logged in as the project owner
- Try running the migration in the Supabase dashboard's SQL Editor

**To reset everything (careful - this deletes data!):**
```sql
DROP TABLE IF EXISTS public.profiles CASCADE;
```
Then run the migration again.
