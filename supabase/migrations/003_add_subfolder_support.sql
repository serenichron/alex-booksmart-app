-- Add parent_folder_id to folders table to support nested folder hierarchy
ALTER TABLE folders
ADD COLUMN parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;

-- Add index for better query performance when fetching folder hierarchies
CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id);

-- Add index for common query pattern (board + parent lookup)
CREATE INDEX idx_folders_board_parent ON folders(board_id, parent_folder_id);
