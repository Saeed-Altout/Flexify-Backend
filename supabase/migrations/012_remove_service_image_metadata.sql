-- =====================================================
-- Migration: Remove image_url from services and 
--            meta_title, meta_description from service_translations
-- =====================================================

-- Remove image_url column from services table
ALTER TABLE services DROP COLUMN IF EXISTS image_url;

-- Remove meta_title and meta_description columns from service_translations table
ALTER TABLE service_translations DROP COLUMN IF EXISTS meta_title;
ALTER TABLE service_translations DROP COLUMN IF EXISTS meta_description;

-- Also remove short_description and content if they exist (as per user requirements)
ALTER TABLE service_translations DROP COLUMN IF EXISTS short_description;
ALTER TABLE service_translations DROP COLUMN IF EXISTS content;

