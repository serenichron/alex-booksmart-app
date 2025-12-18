-- BookSmart Migration SQL
-- This adds missing tables and fields to work with existing schema
-- Run this in your Supabase SQL Editor

-- Add boards table (new)
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on boards
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view their own boards"
  ON boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- Add board_id to bookmarks table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'board_id'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN board_id UUID REFERENCES boards(id) ON DELETE CASCADE;
    CREATE INDEX idx_bookmarks_board_id ON bookmarks(board_id);
  END IF;
END $$;

-- Add missing fields to bookmarks table (if they don't exist)
DO $$
BEGIN
  -- Add meta_description if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN meta_description TEXT;
  END IF;

  -- Add show_meta_description if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'show_meta_description'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN show_meta_description BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add image_url if missing (they have thumbnail_url, we need image_url)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN image_url TEXT;
  END IF;

  -- Add categories array if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'categories'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN categories TEXT[] DEFAULT '{}';
  END IF;

  -- Add tags array if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'tags'
  ) THEN
    ALTER TABLE bookmarks ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add 'todo' to type check constraint
DO $$
BEGIN
  ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_type_check;
  ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_type_check
    CHECK (type IN ('link', 'image', 'text', 'todo', 'document', 'video', 'other'));
END $$;

-- Notes table (new)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view notes for their bookmarks"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = notes.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their bookmarks"
  ON notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = notes.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes for their bookmarks"
  ON notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = notes.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes for their bookmarks"
  ON notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = notes.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

-- Todo items table (new)
CREATE TABLE IF NOT EXISTS todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on todo_items
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- Todo items policies
CREATE POLICY "Users can view todo items for their bookmarks"
  ON todo_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = todo_items.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create todo items for their bookmarks"
  ON todo_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = todo_items.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update todo items for their bookmarks"
  ON todo_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = todo_items.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete todo items for their bookmarks"
  ON todo_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bookmarks
      WHERE bookmarks.id = todo_items.bookmark_id
      AND bookmarks.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_bookmark_id ON notes(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_bookmark_id ON todo_items(bookmark_id);

-- Trigger for boards updated_at
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
