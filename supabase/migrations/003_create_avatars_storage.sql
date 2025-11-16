-- ============================================
-- SUPABASE STORAGE: AVATARS BUCKET
-- ============================================
-- 
-- This migration creates a storage bucket for user avatars with proper
-- security policies for public read access and authenticated write access.
--
-- IMPORTANT NOTES:
-- 1. The bucket is public for read access (avatars need to be accessible)
-- 2. Authenticated users can only upload/update/delete their own avatars
-- 3. Service role (backend) can manage all avatars
-- 4. File size limit: 5MB
-- 5. Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
--
-- ============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket so avatars can be accessed without authentication
  5242880, -- 5MB file size limit (5 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Policy: Allow public read access to avatars
-- Anyone can view avatars (needed for displaying profile pictures)
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Allow authenticated users to upload their own avatars
-- Users can upload avatars that match their user ID in the file path
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  -- File path should start with user's ID (e.g., "avatars/{userId}-{timestamp}.jpg")
  (storage.foldername(name))[1] = auth.uid()::text OR
  -- Or allow if filename starts with user ID (for flat structure)
  name LIKE auth.uid()::text || '-%'
);

-- Policy: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '-%'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '-%'
  )
);

-- Policy: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    name LIKE auth.uid()::text || '-%'
  )
);

-- Policy: Allow service_role to manage all avatars (for backend operations)
-- This allows the NestJS backend (using service_role key) to upload/update/delete any avatar
CREATE POLICY "Service role can manage avatars"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars' AND
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.jwt() ->> 'role' = 'service_role'
);

