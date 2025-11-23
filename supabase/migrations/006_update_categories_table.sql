-- =====================================================
-- UPDATE CATEGORIES TABLE
-- Remove name_en, name_ar, color
-- Add name, description
-- =====================================================

-- Step 1: Add new columns (nullable first)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Migrate existing data from name_en to name
UPDATE categories 
SET name = COALESCE(name, name_en, 'Unnamed Category')
WHERE name IS NULL OR name = '';

-- Step 3: Make name NOT NULL after migration
ALTER TABLE categories 
  ALTER COLUMN name SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE categories 
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS name_ar,
  DROP COLUMN IF EXISTS color;

-- Step 5: Add index on name for better search performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

