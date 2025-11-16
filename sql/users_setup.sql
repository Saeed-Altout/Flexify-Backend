-- ============================================================================
-- USERS SETUP SQL FOR SUPABASE
-- ============================================================================
-- This file contains all the SQL needed to set up the users and authentication
-- tables in Supabase PostgreSQL database.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(30) UNIQUE,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_name VARCHAR(100),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for password_reset_tokens table
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- VERIFICATION CODES TABLE (OTP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) DEFAULT 'email' CHECK (type IN ('email', 'phone')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for verification_codes table
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_used ON verification_codes(used);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- ============================================================================
-- OTP VERIFICATIONS TABLE (Alternative OTP storage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for otp_verifications table
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for refresh_tokens table
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_active ON refresh_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- PENDING SIGNUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pending_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pending_signups table
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_expires_at ON pending_signups(expires_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for sessions table
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired sessions (can be called via cron job)
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW() OR is_active = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_signups ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Users can update their own data (except role and status)
-- Note: We can't prevent role/status changes in RLS policy directly
-- This should be handled in application logic
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- Sessions: Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON sessions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Service role can manage all sessions
CREATE POLICY "Service role manages sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Similar policies for other tables...
-- Note: Since you're using service_role key in backend, RLS policies
-- may not be strictly necessary, but they're good for security if
-- you ever expose direct database access to frontend.

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================
-- You can uncomment and modify this to create an initial admin user
-- Make sure to hash the password using bcrypt first!

-- INSERT INTO users (
--   email,
--   password_hash,
--   first_name,
--   last_name,
--   role,
--   status,
--   email_verified,
--   language
-- ) VALUES (
--   'admin@example.com',
--   '$2a$12$YourHashedPasswordHere', -- Replace with actual bcrypt hash
--   'Admin',
--   'User',
--   'admin',
--   'active',
--   true,
--   'en'
-- );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Make sure to run this SQL in your Supabase SQL Editor
-- 2. Replace 'service_role' checks in RLS policies if you use different auth
-- 3. The password_hash should be bcrypt hashed (12 rounds recommended)
-- 4. Adjust indexes based on your query patterns
-- 5. Consider adding more constraints or validations as needed
-- 6. Set up cron jobs in Supabase to clean expired sessions/tokens regularly

