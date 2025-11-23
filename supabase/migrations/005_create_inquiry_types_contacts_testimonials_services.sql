-- =====================================================
-- INQUIRY TYPES, CONTACTS, TESTIMONIALS, SERVICES MIGRATION
-- =====================================================

-- 1. Create ENUM types
CREATE TYPE contact_status AS ENUM ('new', 'read', 'replied', 'archived');

-- =====================================================
-- 2. INQUIRY TYPES TABLE (Main)
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiry_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(100),
  color VARCHAR(7),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inquiry_types_slug ON inquiry_types(slug);
CREATE INDEX idx_inquiry_types_is_active ON inquiry_types(is_active);
CREATE INDEX idx_inquiry_types_order_index ON inquiry_types(order_index);

CREATE TRIGGER update_inquiry_types_updated_at
  BEFORE UPDATE ON inquiry_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. INQUIRY TYPE TRANSLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiry_type_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type_id UUID NOT NULL REFERENCES inquiry_types(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(inquiry_type_id, locale)
);

CREATE INDEX idx_inquiry_type_translations_inquiry_type_id ON inquiry_type_translations(inquiry_type_id);
CREATE INDEX idx_inquiry_type_translations_locale ON inquiry_type_translations(locale);

CREATE TRIGGER update_inquiry_type_translations_updated_at
  BEFORE UPDATE ON inquiry_type_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status contact_status DEFAULT 'new',
  inquiry_type_id UUID REFERENCES inquiry_types(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_inquiry_type_id ON contacts(inquiry_type_id);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TESTIMONIALS TABLE (Main)
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX idx_testimonials_is_approved ON testimonials(is_approved);
CREATE INDEX idx_testimonials_order_index ON testimonials(order_index);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at);

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. TESTIMONIAL TRANSLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonial_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_position VARCHAR(255),
  company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(testimonial_id, locale)
);

CREATE INDEX idx_testimonial_translations_testimonial_id ON testimonial_translations(testimonial_id);
CREATE INDEX idx_testimonial_translations_locale ON testimonial_translations(locale);

CREATE TRIGGER update_testimonial_translations_updated_at
  BEFORE UPDATE ON testimonial_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. SERVICES TABLE (Main)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(100),
  image_url TEXT,
  color VARCHAR(7),
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_is_featured ON services(is_featured);
CREATE INDEX idx_services_order_index ON services(order_index);
CREATE INDEX idx_services_created_at ON services(created_at);

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SERVICE TRANSLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  content TEXT,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, locale)
);

CREATE INDEX idx_service_translations_service_id ON service_translations(service_id);
CREATE INDEX idx_service_translations_locale ON service_translations(locale);

CREATE TRIGGER update_service_translations_updated_at
  BEFORE UPDATE ON service_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE inquiry_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_type_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_translations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS POLICIES - Inquiry Types (Public Read, Admin Write)
-- =====================================================

-- Allow public to view active inquiry types
CREATE POLICY "Allow public to view active inquiry types"
ON inquiry_types FOR SELECT
TO public
USING (is_active = true);

-- Allow admins to view all inquiry types
CREATE POLICY "Allow admins to view all inquiry types"
ON inquiry_types FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to manage inquiry types
CREATE POLICY "Allow admins to manage inquiry types"
ON inquiry_types FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 11. RLS POLICIES - Inquiry Type Translations
-- =====================================================

-- Allow public to view translations of active inquiry types
CREATE POLICY "Allow public to view active inquiry type translations"
ON inquiry_type_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM inquiry_types 
    WHERE inquiry_types.id = inquiry_type_translations.inquiry_type_id 
    AND inquiry_types.is_active = true
  )
);

-- Allow admins full access to translations
CREATE POLICY "Allow admins full access to inquiry type translations"
ON inquiry_type_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 12. RLS POLICIES - Contacts (Public Create, Admin Read/Update)
-- =====================================================

-- Allow public to create contacts
CREATE POLICY "Allow public to create contacts"
ON contacts FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins to view all contacts
CREATE POLICY "Allow admins to view all contacts"
ON contacts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to update contacts
CREATE POLICY "Allow admins to update contacts"
ON contacts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to delete contacts
CREATE POLICY "Allow admins to delete contacts"
ON contacts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 13. RLS POLICIES - Testimonials (Public Read Approved, Admin Write)
-- =====================================================

-- Allow public to view approved testimonials
CREATE POLICY "Allow public to view approved testimonials"
ON testimonials FOR SELECT
TO public
USING (is_approved = true);

-- Allow admins to view all testimonials
CREATE POLICY "Allow admins to view all testimonials"
ON testimonials FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to manage testimonials
CREATE POLICY "Allow admins to manage testimonials"
ON testimonials FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 14. RLS POLICIES - Testimonial Translations
-- =====================================================

-- Allow public to view translations of approved testimonials
CREATE POLICY "Allow public to view approved testimonial translations"
ON testimonial_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM testimonials 
    WHERE testimonials.id = testimonial_translations.testimonial_id 
    AND testimonials.is_approved = true
  )
);

-- Allow admins full access to translations
CREATE POLICY "Allow admins full access to testimonial translations"
ON testimonial_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 15. RLS POLICIES - Services (Public Read Active, Admin Write)
-- =====================================================

-- Allow public to view active services
CREATE POLICY "Allow public to view active services"
ON services FOR SELECT
TO public
USING (is_active = true);

-- Allow admins to view all services
CREATE POLICY "Allow admins to view all services"
ON services FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to manage services
CREATE POLICY "Allow admins to manage services"
ON services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 16. RLS POLICIES - Service Translations
-- =====================================================

-- Allow public to view translations of active services
CREATE POLICY "Allow public to view active service translations"
ON service_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM services 
    WHERE services.id = service_translations.service_id 
    AND services.is_active = true
  )
);

-- Allow admins full access to translations
CREATE POLICY "Allow admins full access to service translations"
ON service_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- STORAGE BUCKET for Testimonial Avatars
-- =====================================================

-- Create testimonial-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonial-avatars',
  'testimonial-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES for Testimonial Avatars
-- =====================================================

-- Policy: Allow authenticated users to upload testimonial avatars
CREATE POLICY "Allow authenticated users to upload testimonial avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'testimonial-avatars');

-- Policy: Allow public read access to testimonial avatars
CREATE POLICY "Allow public read access to testimonial avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'testimonial-avatars');

-- Policy: Allow users to update testimonial avatars
CREATE POLICY "Allow users to update testimonial avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'testimonial-avatars')
WITH CHECK (bucket_id = 'testimonial-avatars');

-- Policy: Allow users to delete testimonial avatars
CREATE POLICY "Allow users to delete testimonial avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'testimonial-avatars');

-- =====================================================
-- STORAGE BUCKET for Service Images
-- =====================================================

-- Create service-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES for Service Images
-- =====================================================

-- Policy: Allow authenticated users to upload service images
CREATE POLICY "Allow authenticated users to upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images');

-- Policy: Allow public read access to service images
CREATE POLICY "Allow public read access to service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Policy: Allow users to update service images
CREATE POLICY "Allow users to update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

-- Policy: Allow users to delete service images
CREATE POLICY "Allow users to delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images');

