-- =====================================================
-- VERIFY SITE SETTINGS
-- =====================================================
-- This migration contains SQL queries to verify site settings data
-- Run these queries to check the current state of site settings

-- =====================================================
-- 1. CHECK ALL SITE SETTINGS
-- =====================================================
SELECT 
  id,
  key,
  value,
  created_at,
  updated_at
FROM site_settings
ORDER BY key;

-- =====================================================
-- 2. CHECK SITE SETTING TRANSLATIONS
-- =====================================================
SELECT 
  sst.id,
  ss.key AS setting_key,
  sst.locale,
  sst.value AS translation_value,
  sst.created_at,
  sst.updated_at
FROM site_setting_translations sst
JOIN site_settings ss ON sst.site_setting_id = ss.id
ORDER BY ss.key, sst.locale;

-- =====================================================
-- 3. CHECK NAVBAR LINKS
-- =====================================================
SELECT 
  nl.id,
  nl.href,
  nl.icon,
  nl.order_index,
  nl.is_active,
  nl.created_at,
  nl.updated_at
FROM navbar_links nl
ORDER BY nl.order_index;

-- =====================================================
-- 4. CHECK NAVBAR LINK TRANSLATIONS
-- =====================================================
SELECT 
  nlt.id,
  nl.href,
  nlt.locale,
  nlt.label,
  nlt.created_at,
  nlt.updated_at
FROM navbar_link_translations nlt
JOIN navbar_links nl ON nlt.navbar_link_id = nl.id
ORDER BY nl.order_index, nlt.locale;

-- =====================================================
-- 5. CHECK SPECIFIC SETTINGS (HERO, STATISTICS, ABOUT, FOOTER, GITHUB, CV)
-- =====================================================

-- Hero Settings
SELECT 
  'hero' AS setting_type,
  ss.value AS settings,
  json_agg(
    json_build_object(
      'locale', sst.locale,
      'translation', sst.value
    )
  ) AS translations
FROM site_settings ss
LEFT JOIN site_setting_translations sst ON ss.id = sst.site_setting_id
WHERE ss.key = 'hero'
GROUP BY ss.id, ss.value;

-- Statistics Settings
SELECT 
  'statistics' AS setting_type,
  ss.value AS settings,
  json_agg(
    json_build_object(
      'locale', sst.locale,
      'translation', sst.value
    )
  ) AS translations
FROM site_settings ss
LEFT JOIN site_setting_translations sst ON ss.id = sst.site_setting_id
WHERE ss.key = 'statistics'
GROUP BY ss.id, ss.value;

-- About Settings
SELECT 
  'about' AS setting_type,
  ss.value AS settings,
  json_agg(
    json_build_object(
      'locale', sst.locale,
      'translation', sst.value
    )
  ) AS translations
FROM site_settings ss
LEFT JOIN site_setting_translations sst ON ss.id = sst.site_setting_id
WHERE ss.key = 'about'
GROUP BY ss.id, ss.value;

-- Footer Settings
SELECT 
  'footer' AS setting_type,
  ss.value AS settings,
  json_agg(
    json_build_object(
      'locale', sst.locale,
      'translation', sst.value
    )
  ) AS translations
FROM site_settings ss
LEFT JOIN site_setting_translations sst ON ss.id = sst.site_setting_id
WHERE ss.key = 'footer'
GROUP BY ss.id, ss.value;

-- GitHub Settings
SELECT 
  'github' AS setting_type,
  ss.value AS settings
FROM site_settings ss
WHERE ss.key = 'github';

-- CV Settings
SELECT 
  'cv' AS setting_type,
  ss.value AS settings
FROM site_settings ss
WHERE ss.key = 'cv';

-- =====================================================
-- 6. DETAILED FOOTER VERIFICATION
-- =====================================================
-- Check footer structure
SELECT 
  ss.key,
  ss.value->'socialLinks' AS social_links,
  ss.value->'columns' AS columns,
  ss.value->'contact' AS contact
FROM site_settings ss
WHERE ss.key = 'footer';

-- Check footer translations by locale
SELECT 
  sst.locale,
  sst.value->'description' AS description,
  sst.value->'contact' AS contact,
  sst.value->'columns' AS columns,
  sst.value->'copyright' AS copyright,
  sst.value->'rights' AS rights
FROM site_setting_translations sst
JOIN site_settings ss ON sst.site_setting_id = ss.id
WHERE ss.key = 'footer'
ORDER BY sst.locale;

-- =====================================================
-- 7. COUNT VERIFICATION
-- =====================================================
SELECT 
  'Site Settings' AS table_name,
  COUNT(*) AS total_count
FROM site_settings
UNION ALL
SELECT 
  'Site Setting Translations' AS table_name,
  COUNT(*) AS total_count
FROM site_setting_translations
UNION ALL
SELECT 
  'Navbar Links' AS table_name,
  COUNT(*) AS total_count
FROM navbar_links
UNION ALL
SELECT 
  'Navbar Link Translations' AS table_name,
  COUNT(*) AS total_count
FROM navbar_link_translations;

-- =====================================================
-- 8. CHECK FOR MISSING TRANSLATIONS
-- =====================================================
SELECT 
  ss.key AS setting_key,
  ss.id AS setting_id,
  CASE 
    WHEN COUNT(CASE WHEN sst.locale = 'en' THEN 1 END) = 0 THEN 'Missing EN'
    WHEN COUNT(CASE WHEN sst.locale = 'ar' THEN 1 END) = 0 THEN 'Missing AR'
    ELSE 'OK'
  END AS translation_status
FROM site_settings ss
LEFT JOIN site_setting_translations sst ON ss.id = sst.site_setting_id
WHERE ss.key IN ('hero', 'statistics', 'about', 'footer')
GROUP BY ss.id, ss.key
HAVING COUNT(CASE WHEN sst.locale = 'en' THEN 1 END) = 0 
   OR COUNT(CASE WHEN sst.locale = 'ar' THEN 1 END) = 0;

-- =====================================================
-- 9. CHECK NAVBAR LINKS WITH TRANSLATIONS
-- =====================================================
SELECT 
  nl.id,
  nl.href,
  nl.icon,
  nl.order_index,
  nl.is_active,
  json_agg(
    json_build_object(
      'locale', nlt.locale,
      'label', nlt.label
    )
  ) AS translations
FROM navbar_links nl
LEFT JOIN navbar_link_translations nlt ON nl.id = nlt.navbar_link_id
GROUP BY nl.id, nl.href, nl.icon, nl.order_index, nl.is_active
ORDER BY nl.order_index;

-- =====================================================
-- 10. VERIFY FOOTER COLUMNS STRUCTURE
-- =====================================================
SELECT 
  ss.key,
  jsonb_array_length(ss.value->'columns') AS column_count,
  jsonb_array_elements(ss.value->'columns') AS column_data
FROM site_settings ss
WHERE ss.key = 'footer';

-- =====================================================
-- 11. CHECK STORAGE BUCKET FOR CV FILES
-- =====================================================
SELECT 
  name,
  id,
  public,
  created_at,
  updated_at
FROM storage.buckets
WHERE id = 'cv-files';

-- Check CV files in storage
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'cv-files'
ORDER BY created_at DESC;

