-- =====================================================
-- SITE SETTINGS MIGRATION
-- =====================================================
-- This migration creates tables for managing site-wide settings
-- including navbar links, hero section, statistics, about section, and footer

-- =====================================================
-- 1. NAVBAR LINKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS navbar_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  href VARCHAR(255) NOT NULL,
  icon VARCHAR(100), -- Icon name from Tabler Icons
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_navbar_links_order_index ON navbar_links(order_index);
CREATE INDEX idx_navbar_links_is_active ON navbar_links(is_active);

CREATE TRIGGER update_navbar_links_updated_at
  BEFORE UPDATE ON navbar_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. NAVBAR LINK TRANSLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS navbar_link_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navbar_link_id UUID NOT NULL REFERENCES navbar_links(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(navbar_link_id, locale)
);

CREATE INDEX idx_navbar_link_translations_navbar_link_id ON navbar_link_translations(navbar_link_id);
CREATE INDEX idx_navbar_link_translations_locale ON navbar_link_translations(locale);

CREATE TRIGGER update_navbar_link_translations_updated_at
  BEFORE UPDATE ON navbar_link_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. SITE SETTINGS TABLE (For GitHub, Hero, Statistics, About, Footer)
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'github', 'hero', 'statistics', 'about', 'footer'
  value JSONB NOT NULL, -- Flexible JSON structure for different settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_site_settings_key ON site_settings(key);

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. SITE SETTING TRANSLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS site_setting_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_setting_id UUID NOT NULL REFERENCES site_settings(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  value JSONB NOT NULL, -- Translated content in JSON format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_setting_id, locale)
);

CREATE INDEX idx_site_setting_translations_site_setting_id ON site_setting_translations(site_setting_id);
CREATE INDEX idx_site_setting_translations_locale ON site_setting_translations(locale);

CREATE TRIGGER update_site_setting_translations_updated_at
  BEFORE UPDATE ON site_setting_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE navbar_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE navbar_link_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_setting_translations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES - Navbar Links (Public Read, Admin Write)
-- =====================================================

-- Allow public to view active navbar links
CREATE POLICY "Allow public to view active navbar links"
ON navbar_links FOR SELECT
TO public
USING (is_active = true);

-- Allow admins to view all navbar links
CREATE POLICY "Allow admins to view all navbar links"
ON navbar_links FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to manage navbar links
CREATE POLICY "Allow admins to manage navbar links"
ON navbar_links FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 7. RLS POLICIES - Navbar Link Translations
-- =====================================================

-- Allow public to view translations of active navbar links
CREATE POLICY "Allow public to view active navbar link translations"
ON navbar_link_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM navbar_links 
    WHERE navbar_links.id = navbar_link_translations.navbar_link_id 
    AND navbar_links.is_active = true
  )
);

-- Allow admins full access to translations
CREATE POLICY "Allow admins full access to navbar link translations"
ON navbar_link_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 8. RLS POLICIES - Site Settings (Public Read, Admin Write)
-- =====================================================

-- Allow public to view site settings
CREATE POLICY "Allow public to view site settings"
ON site_settings FOR SELECT
TO public
USING (true);

-- Allow admins to manage site settings
CREATE POLICY "Allow admins to manage site settings"
ON site_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 9. RLS POLICIES - Site Setting Translations
-- =====================================================

-- Allow public to view site setting translations
CREATE POLICY "Allow public to view site setting translations"
ON site_setting_translations FOR SELECT
TO public
USING (true);

-- Allow admins full access to translations
CREATE POLICY "Allow admins full access to site setting translations"
ON site_setting_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 10. INSERT DEFAULT SETTINGS
-- =====================================================

-- GitHub Settings
INSERT INTO site_settings (key, value) VALUES (
  'github',
  '{"repoUrl": "https://github.com/Saeed-Altout", "followers": 17}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- CV Button Settings
INSERT INTO site_settings (key, value) VALUES (
  'cv',
  '{"url": "/Saeed-Altout-CV.pdf", "fileName": "Saeed-Altout-CV.pdf"}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Hero Section Settings (default values, will be overridden by translations)
INSERT INTO site_settings (key, value) VALUES (
  'hero',
  '{"techIcons": ["nextjs", "nestjs", "typescript", "prisma", "mysql", "supabase"]}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Statistics Settings
INSERT INTO site_settings (key, value) VALUES (
  'statistics',
  '{"items": [{"id": "years", "value": 5, "suffix": "+", "icon": "briefcase"}, {"id": "projects", "value": 50, "suffix": "+", "icon": "folder"}, {"id": "technologies", "value": 20, "suffix": "+", "icon": "code"}, {"id": "clients", "value": 30, "suffix": "+", "icon": "users"}]}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- About Section Settings
INSERT INTO site_settings (key, value) VALUES (
  'about',
  '{"highlights": [{"id": "code", "icon": "code"}, {"id": "rocket", "icon": "rocket"}, {"id": "heart", "icon": "heart"}, {"id": "target", "icon": "target"}]}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Footer Settings
INSERT INTO site_settings (key, value) VALUES (
  'footer',
  '{"socialLinks": [{"icon": "Github", "href": "https://github.com/Saeed-Altout"}, {"icon": "Linkedin", "href": "#"}, {"icon": "Twitter", "href": "#"}, {"icon": "Mail", "href": "mailto:your.email@example.com"}], "columns": [{"key": "quickLinks", "links": [{"href": "/", "key": "home"}, {"href": "/about", "key": "about"}, {"href": "/projects", "key": "projects"}, {"href": "/contact", "key": "contact"}]}, {"key": "resources", "links": [{"href": "/blog", "key": "blog"}, {"href": "#", "key": "other"}]}], "contact": {"email": "your.email@example.com", "phone": "+1 (555) 123-4567", "location": "Your City, Country"}}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Insert default footer translations (English)
INSERT INTO site_setting_translations (site_setting_id, locale, value)
SELECT ss.id, 'en',
  '{"description": "Building digital experiences with passion and precision.", "contact": {"title": "Contact"}, "columns": {"quickLinks": {"title": "Quick Links", "links": {"home": "Home", "about": "About", "projects": "Projects", "contact": "Contact"}}, "resources": {"title": "Resources", "links": {"blog": "Blog", "other": "Other"}}}, "copyright": "All rights reserved.", "rights": "Built with Next.js, NestJS & TypeScript"}'::jsonb
FROM site_settings ss
WHERE ss.key = 'footer'
ON CONFLICT (site_setting_id, locale) DO NOTHING;

-- Insert default footer translations (Arabic)
INSERT INTO site_setting_translations (site_setting_id, locale, value)
SELECT ss.id, 'ar',
  '{"description": "بناء تجارب رقمية بشغف ودقة.", "contact": {"title": "اتصل بنا"}, "columns": {"quickLinks": {"title": "روابط سريعة", "links": {"home": "الرئيسية", "about": "نبذة عني", "projects": "المشاريع", "contact": "تواصل معي"}}, "resources": {"title": "الموارد", "links": {"blog": "المدونة", "other": "أخرى"}}}, "copyright": "جميع الحقوق محفوظة.", "rights": "مبني بـ Next.js و NestJS و TypeScript"}'::jsonb
FROM site_settings ss
WHERE ss.key = 'footer'
ON CONFLICT (site_setting_id, locale) DO NOTHING;

-- Insert default navbar links
INSERT INTO navbar_links (href, icon, order_index, is_active) VALUES
  ('/', 'IconHome', 0, true),
  ('/projects', 'IconBriefcase', 1, true),
  ('/services', 'IconCode', 2, true),
  ('/contact', 'IconMail', 3, true)
ON CONFLICT DO NOTHING;

-- Insert default navbar link translations (English)
INSERT INTO navbar_link_translations (navbar_link_id, locale, label)
SELECT nl.id, 'en', 
  CASE 
    WHEN nl.href = '/' THEN 'Home'
    WHEN nl.href = '/projects' THEN 'Projects'
    WHEN nl.href = '/services' THEN 'Services'
    WHEN nl.href = '/contact' THEN 'Contact'
    ELSE 'Link'
  END
FROM navbar_links nl
ON CONFLICT (navbar_link_id, locale) DO NOTHING;

-- Insert default navbar link translations (Arabic)
INSERT INTO navbar_link_translations (navbar_link_id, locale, label)
SELECT nl.id, 'ar', 
  CASE 
    WHEN nl.href = '/' THEN 'الرئيسية'
    WHEN nl.href = '/projects' THEN 'المشاريع'
    WHEN nl.href = '/services' THEN 'الخدمات'
    WHEN nl.href = '/contact' THEN 'تواصل معي'
    ELSE 'رابط'
  END
FROM navbar_links nl
ON CONFLICT (navbar_link_id, locale) DO NOTHING;

