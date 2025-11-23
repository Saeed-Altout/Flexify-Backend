-- =====================================================
-- REMOVE COLOR FROM SERVICES AND INQUIRY_TYPES TABLES
-- =====================================================

-- Remove color column from services table
ALTER TABLE services 
  DROP COLUMN IF EXISTS color;

-- Remove color column from inquiry_types table
ALTER TABLE inquiry_types 
  DROP COLUMN IF EXISTS color;

