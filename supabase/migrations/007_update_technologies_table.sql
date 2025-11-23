-- =====================================================
-- UPDATE TECHNOLOGIES TABLE
-- Remove color
-- Add description
-- =====================================================

-- Step 1: Add description column (nullable)
ALTER TABLE technologies 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Drop color column
ALTER TABLE technologies 
  DROP COLUMN IF EXISTS color;

-- Step 3: Add index on description for better search performance (optional, for full-text search)
-- Note: This is optional, only add if you plan to do full-text search on description
-- CREATE INDEX IF NOT EXISTS idx_technologies_description ON technologies USING gin(to_tsvector('english', description));

