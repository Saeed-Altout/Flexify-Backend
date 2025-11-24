-- =====================================================
-- CV FILES STORAGE BUCKET
-- =====================================================

-- Create cv-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-files',
  'cv-files',
  true,
  10485760, -- 10MB limit for PDF files
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES for CV Files
-- =====================================================

-- Policy: Allow authenticated users to upload CV files
CREATE POLICY "Allow authenticated users to upload CV files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cv-files');

-- Policy: Allow public read access to CV files
CREATE POLICY "Allow public read access to CV files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cv-files');

-- Policy: Allow users to update CV files
CREATE POLICY "Allow users to update CV files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cv-files')
WITH CHECK (bucket_id = 'cv-files');

-- Policy: Allow users to delete CV files
CREATE POLICY "Allow users to delete CV files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cv-files');

