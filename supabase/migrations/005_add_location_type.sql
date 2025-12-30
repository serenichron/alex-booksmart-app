-- Add location bookmark type and related fields

-- First, drop the existing constraint
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_type_check;

-- Add the new constraint with 'location' included
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_type_check
  CHECK (type IN ('link', 'image', 'text', 'todo', 'document', 'video', 'location', 'other'));

-- Add location-specific columns
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS location_source TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create an index on latitude/longitude for efficient location queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_location ON bookmarks(latitude, longitude) WHERE type = 'location';

-- Add comment for documentation
COMMENT ON COLUMN bookmarks.latitude IS 'Latitude coordinate for location bookmarks (-90 to 90)';
COMMENT ON COLUMN bookmarks.longitude IS 'Longitude coordinate for location bookmarks (-180 to 180)';
COMMENT ON COLUMN bookmarks.location_name IS 'Human-readable name of the location';
COMMENT ON COLUMN bookmarks.place_id IS 'Google Maps Place ID or equivalent from other mapping services';
COMMENT ON COLUMN bookmarks.location_source IS 'Source of the location (google_maps, apple_maps, waze, osm, what3words, bing)';
COMMENT ON COLUMN bookmarks.location_address IS 'Full formatted address of the location';
