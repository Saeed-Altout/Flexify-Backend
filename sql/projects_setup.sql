-- ============================================================================
-- PROJECTS SETUP SQL FOR SUPABASE
-- ============================================================================
-- This file contains all the SQL needed to set up the projects tables
-- for a portfolio application with multi-language support, ratings, and likes.
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  role VARCHAR(100) NOT NULL,
  github_url TEXT,
  github_backend_url TEXT,
  live_demo_url TEXT,
  main_image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  average_rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0),
  total_likes INTEGER DEFAULT 0 CHECK (total_likes >= 0),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_average_rating ON projects(average_rating);
CREATE INDEX IF NOT EXISTS idx_projects_total_likes ON projects(total_likes);

-- GIN index for tech_stack JSONB search
CREATE INDEX IF NOT EXISTS idx_projects_tech_stack ON projects USING GIN (tech_stack);

-- ============================================================================
-- PROJECT TRANSLATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL CHECK (language IN ('en', 'ar')),
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  architecture TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, language)
);

-- Create indexes for project_translations table
CREATE INDEX IF NOT EXISTS idx_project_translations_project_id ON project_translations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_translations_language ON project_translations(language);
CREATE INDEX IF NOT EXISTS idx_project_translations_title ON project_translations USING GIN (to_tsvector('english', title));

-- ============================================================================
-- PROJECT RATINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create indexes for project_ratings table
CREATE INDEX IF NOT EXISTS idx_project_ratings_project_id ON project_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ratings_user_id ON project_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_project_ratings_rating ON project_ratings(rating);

-- ============================================================================
-- PROJECT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create indexes for project_likes table
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Trigger to auto-update updated_at for project_translations table
DROP TRIGGER IF EXISTS update_project_translations_updated_at ON project_translations;
CREATE TRIGGER update_project_translations_updated_at
  BEFORE UPDATE ON project_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Trigger to auto-update updated_at for project_ratings table
DROP TRIGGER IF EXISTS update_project_ratings_updated_at ON project_ratings;
CREATE TRIGGER update_project_ratings_updated_at
  BEFORE UPDATE ON project_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- ============================================================================
-- FUNCTION: Update project average rating and total ratings
-- ============================================================================
CREATE OR REPLACE FUNCTION update_project_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3, 2);
  total_count INTEGER;
BEGIN
  -- Calculate average rating and total count
  SELECT 
    COALESCE(AVG(rating)::DECIMAL(3, 2), 0.00),
    COUNT(*)
  INTO avg_rating, total_count
  FROM project_ratings
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Update project stats
  UPDATE projects
  SET 
    average_rating = avg_rating,
    total_ratings = total_count,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating stats when rating is added/updated/deleted
DROP TRIGGER IF EXISTS trigger_update_project_rating_stats ON project_ratings;
CREATE TRIGGER trigger_update_project_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON project_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_rating_stats();

-- ============================================================================
-- FUNCTION: Update project total likes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_project_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  likes_count INTEGER;
BEGIN
  -- Count total likes
  SELECT COUNT(*)
  INTO likes_count
  FROM project_likes
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Update project likes count
  UPDATE projects
  SET 
    total_likes = likes_count,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update likes count when like is added/deleted
DROP TRIGGER IF EXISTS trigger_update_project_likes_count ON project_likes;
CREATE TRIGGER trigger_update_project_likes_count
  AFTER INSERT OR DELETE ON project_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_likes_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;

-- Projects: Public can read published projects
CREATE POLICY "Public can read published projects"
  ON projects FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

-- Projects: Users can read their own projects
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Projects: Users can create their own projects
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Projects: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Projects: Users can delete their own projects (soft delete)
CREATE POLICY "Users can delete own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access to projects"
  ON projects FOR ALL
  USING (auth.role() = 'service_role');

-- Project translations: Public can read translations of published projects
CREATE POLICY "Public can read published project translations"
  ON project_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_translations.project_id 
      AND projects.is_published = true 
      AND projects.deleted_at IS NULL
    )
  );

-- Project translations: Users can manage translations of their own projects
CREATE POLICY "Users can manage own project translations"
  ON project_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_translations.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

-- Service role can do everything
CREATE POLICY "Service role full access to translations"
  ON project_translations FOR ALL
  USING (auth.role() = 'service_role');

-- Project ratings: Public can read ratings
CREATE POLICY "Public can read project ratings"
  ON project_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_ratings.project_id 
      AND projects.is_published = true 
      AND projects.deleted_at IS NULL
    )
  );

-- Project ratings: Authenticated users can create/update their own ratings
CREATE POLICY "Users can manage own ratings"
  ON project_ratings FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access to ratings"
  ON project_ratings FOR ALL
  USING (auth.role() = 'service_role');

-- Project likes: Public can read likes
CREATE POLICY "Public can read project likes"
  ON project_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_likes.project_id 
      AND projects.is_published = true 
      AND projects.deleted_at IS NULL
    )
  );

-- Project likes: Authenticated users can create/delete their own likes
CREATE POLICY "Users can manage own likes"
  ON project_likes FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access to likes"
  ON project_likes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Make sure to run this SQL in your Supabase SQL Editor
-- 2. The service_role key bypasses RLS, so backend operations will work
-- 3. tech_stack and features are stored as JSONB arrays
-- 4. images is stored as JSONB array of URLs
-- 5. Rating stats are automatically updated via triggers
-- 6. Likes count is automatically updated via triggers
-- 7. Each project must have translations for both 'en' and 'ar' languages
-- 8. Users can only rate/like once per project (enforced by UNIQUE constraint)

