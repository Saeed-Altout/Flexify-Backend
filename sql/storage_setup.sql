-- ============================================================================
-- STORAGE SETUP SQL FOR SUPABASE
-- ============================================================================
-- This file contains SQL to set up storage buckets and policies for avatars
-- and other file uploads in Supabase.
-- ============================================================================
-- IMPORTANT: You must create the storage bucket FIRST via Supabase Dashboard
-- or Storage API before running these policies.
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET (via Dashboard)
-- ============================================================================
-- Go to Supabase Dashboard → Storage → New Bucket
-- Name: "avatars"
-- Public: true (to allow public access to avatar images)
-- File size limit: 5242880 (5MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- ============================================================================

-- ============================================================================
-- STEP 2: CREATE BUCKET VIA SQL (Alternative method)
-- ============================================================================
-- If you have access to storage.buckets table, you can create it via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================================================

-- Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Service role has full access (for backend operations)
CREATE POLICY "Service role full access to avatars"
ON storage.objects FOR ALL
USING (bucket_id = 'avatars' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTION: Get Avatar URL
-- ============================================================================
-- This function can be used to generate avatar URLs
CREATE OR REPLACE FUNCTION get_avatar_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avatar_path TEXT;
BEGIN
  -- Construct the avatar path based on user ID
  avatar_path := user_id::text || '/avatar';
  
  -- Return the public URL (this would be constructed in application code)
  -- In Supabase, you'd use: supabase.storage.from('avatars').getPublicUrl(path)
  RETURN avatar_path;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Clean up old avatar when new one is uploaded
-- ============================================================================
-- This trigger function deletes the old avatar when a user uploads a new one
CREATE OR REPLACE FUNCTION cleanup_old_avatar()
RETURNS TRIGGER AS $$
DECLARE
  user_folder TEXT;
  old_avatar_path TEXT;
BEGIN
  -- Extract user folder from the new avatar path
  user_folder := (string_to_array(NEW.name, '/'))[1];
  
  -- Find and delete old avatar files for this user
  -- Note: This is a simplified version. In practice, you might want to
  -- keep a reference to the old avatar in the users table
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE user_folder || '/avatar%'
    AND name != NEW.name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (commented out - uncomment if you want automatic cleanup)
-- DROP TRIGGER IF EXISTS trigger_cleanup_old_avatar ON storage.objects;
-- CREATE TRIGGER trigger_cleanup_old_avatar
--   AFTER INSERT ON storage.objects
--   FOR EACH ROW
--   WHEN (NEW.bucket_id = 'avatars')
--   EXECUTE FUNCTION cleanup_old_avatar();

-- ============================================================================
-- FUNCTION: Update user avatar_url when file is uploaded
-- ============================================================================
-- This function updates the users table when an avatar is uploaded
CREATE OR REPLACE FUNCTION update_user_avatar_url()
RETURNS TRIGGER AS $$
DECLARE
  user_id_from_path UUID;
  avatar_url TEXT;
BEGIN
  -- Extract user ID from the file path (assuming format: {user_id}/avatar.{ext})
  user_id_from_path := (string_to_array(NEW.name, '/'))[1]::UUID;
  
  -- Construct the public URL
  -- In Supabase, the public URL format is:
  -- https://{project_ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
  avatar_url := 'https://' || current_setting('app.settings.supabase_url', true) || 
                '/storage/v1/object/public/avatars/' || NEW.name;
  
  -- Update the user's avatar_url
  UPDATE users
  SET avatar_url = avatar_url,
      updated_at = NOW()
  WHERE id = user_id_from_path;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (commented out - uncomment if you want automatic URL updates)
-- DROP TRIGGER IF EXISTS trigger_update_user_avatar_url ON storage.objects;
-- CREATE TRIGGER trigger_update_user_avatar_url
--   AFTER INSERT ON storage.objects
--   FOR EACH ROW
--   WHEN (NEW.bucket_id = 'avatars')
--   EXECUTE FUNCTION update_user_avatar_url();

-- ============================================================================
-- FUNCTION: Clean up avatar when user is deleted
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_user_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all avatar files for the deleted user
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE OLD.id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up avatars when user is deleted
DROP TRIGGER IF EXISTS trigger_cleanup_user_avatar ON users;
CREATE TRIGGER trigger_cleanup_user_avatar
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_user_avatar();

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION (via API or Dashboard)
-- ============================================================================
-- To create the bucket, use one of these methods:
--
-- Method 1: Via Supabase Dashboard
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "avatars"
-- 4. Public: true (if you want public access to avatars)
-- 5. File size limit: 5MB (recommended)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Method 2: Via SQL (if storage.buckets table is accessible)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'avatars',
--   'avatars',
--   true,
--   5242880, -- 5MB in bytes
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The storage bucket must be created via Supabase Dashboard or Storage API
-- 2. File paths should follow the pattern: {user_id}/avatar.{extension}
-- 3. Example path: "550e8400-e29b-41d4-a716-446655440000/avatar.jpg"
-- 4. Public URLs will be: https://{project}.supabase.co/storage/v1/object/public/avatars/{path}
-- 5. Adjust file size limits and MIME types based on your requirements
-- 6. The triggers are optional - you can handle avatar URL updates in your application code instead
-- 7. Make sure RLS is enabled on storage.objects table (usually enabled by default)

-- ============================================================================
-- EXAMPLE: How to use in your application
-- ============================================================================
-- 1. Upload avatar:
--    const { data, error } = await supabase.storage
--      .from('avatars')
--      .upload(`${userId}/avatar.jpg`, file, {
--        contentType: 'image/jpeg',
--        upsert: true
--      });
--
-- 2. Get public URL:
--    const { data: { publicUrl } } = supabase.storage
--      .from('avatars')
--      .getPublicUrl(`${userId}/avatar.jpg`);
--
-- 3. Update user record:
--    await supabase
--      .from('users')
--      .update({ avatar_url: publicUrl })
--      .eq('id', userId);

