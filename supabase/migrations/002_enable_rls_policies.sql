-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- 
-- IMPORTANT NOTES:
-- 1. Service Role Key: When using SUPABASE_SERVICE_ROLE_KEY in your backend,
--    RLS is BYPASSED. These policies protect against direct database access
--    and future use with anon/authenticated keys.
--
-- 2. These policies secure:
--    - Direct SQL access (via Supabase dashboard or SQL editor)
--    - Future client-side access using anon key
--    - Authenticated user access via Supabase Auth
--
-- 3. Your NestJS backend using service role will bypass all RLS policies.
--    This is expected and secure as long as your backend API has proper authentication.
--
-- ============================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Policy: Users can read their own profile
-- Note: This works with Supabase Auth. For service role (backend), RLS is bypassed.
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (
    auth.uid()::text = id::text
    OR auth.jwt() ->> 'role' IN ('service_role', 'authenticated')
  );

-- Policy: Super admins and admins can view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Users can update their own profile (except role and is_active)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (
    auth.uid()::text = id::text
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.uid()::text = id::text
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Super admins can update any user
CREATE POLICY "Super admins can update any user"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role and authenticated admins can insert users
CREATE POLICY "Service and admins can create users"
  ON users
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- Policy: Only service role and super admins can delete users
CREATE POLICY "Service and super admins can delete users"
  ON users
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
  );

-- ============================================
-- REFRESH TOKENS TABLE POLICIES
-- ============================================

-- Policy: Service role and users can view refresh tokens
CREATE POLICY "Service and users can view refresh tokens"
  ON refresh_tokens
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
  );

-- Policy: Service role can insert refresh tokens (for backend API)
CREATE POLICY "Service can insert refresh tokens"
  ON refresh_tokens
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role can update refresh tokens
CREATE POLICY "Service can update refresh tokens"
  ON refresh_tokens
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role and users can delete refresh tokens
CREATE POLICY "Service and users can delete refresh tokens"
  ON refresh_tokens
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- PASSWORD RESET TOKENS TABLE POLICIES
-- ============================================

-- Policy: Service role and admins can view password reset tokens
CREATE POLICY "Service and admins can view password reset tokens"
  ON password_reset_tokens
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
  );

-- Policy: Service role can insert password reset tokens
CREATE POLICY "Service can insert password reset tokens"
  ON password_reset_tokens
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role can update password reset tokens
CREATE POLICY "Service can update password reset tokens"
  ON password_reset_tokens
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role and admins can delete password reset tokens
CREATE POLICY "Service and admins can delete password reset tokens"
  ON password_reset_tokens
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- EMAIL VERIFICATION TOKENS TABLE POLICIES
-- ============================================

-- Policy: Service role and admins can view email verification tokens
CREATE POLICY "Service and admins can view email verification tokens"
  ON email_verification_tokens
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
  );

-- Policy: Service role can insert email verification tokens
CREATE POLICY "Service can insert email verification tokens"
  ON email_verification_tokens
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role can update email verification tokens
CREATE POLICY "Service can update email verification tokens"
  ON email_verification_tokens
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Service role and admins can delete email verification tokens
CREATE POLICY "Service and admins can delete email verification tokens"
  ON email_verification_tokens
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('super_admin', 'admin')
    )
  );

