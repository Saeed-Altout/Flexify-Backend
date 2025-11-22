-- =====================================================
-- PROJECTS FEATURE MIGRATION
-- =====================================================

-- 1. Create ENUM types
CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'published', 'archived');
CREATE TYPE project_type AS ENUM ('personal', 'client', 'open_source');
CREATE TYPE link_type AS ENUM ('github', 'gitlab', 'demo', 'case_study', 'blog', 'documentation', 'backend_github', 'frontend_github', 'api_docs', 'other');
CREATE TYPE interaction_type AS ENUM ('like', 'share');

-- =====================================================
-- 2. PROJECTS TABLE (Main)
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  thumbnail_url TEXT,
  project_type project_type DEFAULT 'personal',
  status project_status DEFAULT 'draft',
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_type ON projects(project_type);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. PROJECT TRANSLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  content TEXT,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, locale)
);

CREATE INDEX idx_project_translations_project_id ON project_translations(project_id);
CREATE INDEX idx_project_translations_locale ON project_translations(locale);

CREATE TRIGGER update_project_translations_updated_at
  BEFORE UPDATE ON project_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. PROJECT IMAGES TABLE (Gallery)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_images_project_id ON project_images(project_id);
CREATE INDEX idx_project_images_order_index ON project_images(order_index);

CREATE TRIGGER update_project_images_updated_at
  BEFORE UPDATE ON project_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TECHNOLOGIES TABLE (Master Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon TEXT,
  color VARCHAR(7),
  category VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_technologies_slug ON technologies(slug);
CREATE INDEX idx_technologies_category ON technologies(category);

CREATE TRIGGER update_technologies_updated_at
  BEFORE UPDATE ON technologies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. PROJECT TECHNOLOGIES (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, technology_id)
);

CREATE INDEX idx_project_technologies_project_id ON project_technologies(project_id);
CREATE INDEX idx_project_technologies_technology_id ON project_technologies(technology_id);

-- =====================================================
-- 7. CATEGORIES TABLE (Master Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  icon TEXT,
  color VARCHAR(7),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. PROJECT CATEGORIES (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, category_id)
);

CREATE INDEX idx_project_categories_project_id ON project_categories(project_id);
CREATE INDEX idx_project_categories_category_id ON project_categories(category_id);

-- =====================================================
-- 9. PROJECT LINKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  link_type link_type NOT NULL,
  url TEXT NOT NULL,
  label VARCHAR(100),
  icon VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_links_project_id ON project_links(project_id);

CREATE TRIGGER update_project_links_updated_at
  BEFORE UPDATE ON project_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. PROJECT INTERACTIONS TABLE (Likes & Shares)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type interaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id, interaction_type)
);

CREATE INDEX idx_project_interactions_project_id ON project_interactions(project_id);
CREATE INDEX idx_project_interactions_user_id ON project_interactions(user_id);
CREATE INDEX idx_project_interactions_type ON project_interactions(interaction_type);

-- =====================================================
-- 11. PROJECT COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX idx_project_comments_user_id ON project_comments(user_id);
CREATE INDEX idx_project_comments_parent_id ON project_comments(parent_id);
CREATE INDEX idx_project_comments_is_approved ON project_comments(is_approved);

CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. STORAGE BUCKETS for Project Images & Thumbnails
-- =====================================================

-- Create project-images bucket (for gallery images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create project-thumbnails bucket (for project thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-thumbnails',
  'project-thumbnails',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 13. STORAGE POLICIES for Project Images
-- =====================================================

-- Policy: Allow authenticated users to upload project images
CREATE POLICY "Allow authenticated users to upload project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Policy: Allow public read access to project images
CREATE POLICY "Allow public read access to project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Policy: Allow users to update their own project images
CREATE POLICY "Allow users to update their own project images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images')
WITH CHECK (bucket_id = 'project-images');

-- Policy: Allow users to delete their own project images
CREATE POLICY "Allow users to delete their own project images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');

-- =====================================================
-- 14. STORAGE POLICIES for Project Thumbnails
-- =====================================================

-- Policy: Allow authenticated users to upload project thumbnails
CREATE POLICY "Allow authenticated users to upload project thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-thumbnails');

-- Policy: Allow public read access to project thumbnails
CREATE POLICY "Allow public read access to project thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-thumbnails');

-- Policy: Allow users to update their own project thumbnails
CREATE POLICY "Allow users to update their own project thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-thumbnails')
WITH CHECK (bucket_id = 'project-thumbnails');

-- Policy: Allow users to delete their own project thumbnails
CREATE POLICY "Allow users to delete their own project thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-thumbnails');

-- =====================================================
-- 15. SEED DATA - Technologies
-- =====================================================
INSERT INTO technologies (slug, name, icon, color, category, order_index) VALUES
  ('react', 'React', 'react', '#61DAFB', 'frontend', 1),
  ('nextjs', 'Next.js', 'nextjs', '#000000', 'frontend', 2),
  ('typescript', 'TypeScript', 'typescript', '#3178C6', 'language', 3),
  ('javascript', 'JavaScript', 'javascript', '#F7DF1E', 'language', 4),
  ('nodejs', 'Node.js', 'nodejs', '#339933', 'backend', 5),
  ('nestjs', 'NestJS', 'nestjs', '#E0234E', 'backend', 6),
  ('tailwindcss', 'Tailwind CSS', 'tailwindcss', '#06B6D4', 'frontend', 7),
  ('postgresql', 'PostgreSQL', 'postgresql', '#4169E1', 'database', 8),
  ('mongodb', 'MongoDB', 'mongodb', '#47A248', 'database', 9),
  ('supabase', 'Supabase', 'supabase', '#3ECF8E', 'backend', 10),
  ('firebase', 'Firebase', 'firebase', '#FFCA28', 'backend', 11),
  ('docker', 'Docker', 'docker', '#2496ED', 'devops', 12),
  ('git', 'Git', 'git', '#F05032', 'tools', 13),
  ('figma', 'Figma', 'figma', '#F24E1E', 'design', 14),
  ('redux', 'Redux', 'redux', '#764ABC', 'frontend', 15),
  ('graphql', 'GraphQL', 'graphql', '#E10098', 'backend', 16),
  ('prisma', 'Prisma', 'prisma', '#2D3748', 'backend', 17),
  ('express', 'Express', 'express', '#000000', 'backend', 18),
  ('vue', 'Vue.js', 'vue', '#4FC08D', 'frontend', 19),
  ('angular', 'Angular', 'angular', '#DD0031', 'frontend', 20),
  ('python', 'Python', 'python', '#3776AB', 'language', 21),
  ('django', 'Django', 'django', '#092E20', 'backend', 22),
  ('flask', 'Flask', 'flask', '#000000', 'backend', 23),
  ('mysql', 'MySQL', 'mysql', '#4479A1', 'database', 24),
  ('redis', 'Redis', 'redis', '#DC382D', 'database', 25),
  ('aws', 'AWS', 'aws', '#FF9900', 'devops', 26),
  ('vercel', 'Vercel', 'vercel', '#000000', 'devops', 27),
  ('sass', 'Sass', 'sass', '#CC6699', 'frontend', 28),
  ('webpack', 'Webpack', 'webpack', '#8DD6F9', 'tools', 29),
  ('vite', 'Vite', 'vite', '#646CFF', 'tools', 30)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 16. SEED DATA - Categories
-- =====================================================
INSERT INTO categories (slug, name_en, name_ar, icon, color, order_index) VALUES
  ('web-app', 'Web Application', 'تطبيق ويب', 'globe', '#3B82F6', 1),
  ('mobile-app', 'Mobile Application', 'تطبيق موبايل', 'smartphone', '#10B981', 2),
  ('api', 'API & Backend', 'واجهة برمجية', 'server', '#8B5CF6', 3),
  ('ui-ux', 'UI/UX Design', 'تصميم واجهة', 'palette', '#F59E0B', 4),
  ('ecommerce', 'E-Commerce', 'متجر إلكتروني', 'shopping-cart', '#EF4444', 5),
  ('dashboard', 'Dashboard', 'لوحة تحكم', 'layout-dashboard', '#06B6D4', 6),
  ('portfolio', 'Portfolio', 'معرض أعمال', 'briefcase', '#EC4899', 7),
  ('saas', 'SaaS Platform', 'منصة سحابية', 'cloud', '#6366F1', 8),
  ('cms', 'CMS', 'نظام إدارة محتوى', 'file-text', '#14B8A6', 9),
  ('other', 'Other', 'أخرى', 'box', '#6B7280', 10)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 17. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 18. RLS POLICIES - Projects (Admin Only for CUD)
-- =====================================================

-- Allow public to view published projects
CREATE POLICY "Allow public to view published projects"
ON projects FOR SELECT
TO public
USING (status = 'published');

-- Allow authenticated admins to view all projects
CREATE POLICY "Allow admins to view all projects"
ON projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to insert projects
CREATE POLICY "Allow admins to insert projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to update projects
CREATE POLICY "Allow admins to update projects"
ON projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to delete projects
CREATE POLICY "Allow admins to delete projects"
ON projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 19. RLS POLICIES - Project Translations
-- =====================================================

-- Allow public to view translations of published projects
CREATE POLICY "Allow public to view published project translations"
ON project_translations FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_translations.project_id 
    AND projects.status = 'published'
  )
);

-- Allow admins full access to translations
CREATE POLICY "Allow admins full access to translations"
ON project_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 20. RLS POLICIES - Project Images
-- =====================================================

-- Allow public to view images of published projects
CREATE POLICY "Allow public to view published project images"
ON project_images FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_images.project_id 
    AND projects.status = 'published'
  )
);

-- Allow admins full access to images
CREATE POLICY "Allow admins full access to project images"
ON project_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 21. RLS POLICIES - Technologies & Categories (Public Read)
-- =====================================================

-- Allow public to view technologies
CREATE POLICY "Allow public to view technologies"
ON technologies FOR SELECT
TO public
USING (true);

-- Allow admins to manage technologies
CREATE POLICY "Allow admins to manage technologies"
ON technologies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow public to view categories
CREATE POLICY "Allow public to view categories"
ON categories FOR SELECT
TO public
USING (true);

-- Allow admins to manage categories
CREATE POLICY "Allow admins to manage categories"
ON categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 22. RLS POLICIES - Junction Tables
-- =====================================================

-- Project Technologies
CREATE POLICY "Allow public to view project technologies"
ON project_technologies FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admins to manage project technologies"
ON project_technologies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Project Categories
CREATE POLICY "Allow public to view project categories"
ON project_categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admins to manage project categories"
ON project_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 23. RLS POLICIES - Project Links
-- =====================================================

CREATE POLICY "Allow public to view project links"
ON project_links FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_links.project_id 
    AND projects.status = 'published'
  )
);

CREATE POLICY "Allow admins to manage project links"
ON project_links FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- 24. RLS POLICIES - Project Interactions
-- =====================================================

-- Allow public to view interactions
CREATE POLICY "Allow public to view project interactions"
ON project_interactions FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create interactions
CREATE POLICY "Allow authenticated users to create interactions"
ON project_interactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own interactions
CREATE POLICY "Allow users to delete their own interactions"
ON project_interactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 25. RLS POLICIES - Project Comments
-- =====================================================

-- Allow public to view approved comments
CREATE POLICY "Allow public to view approved comments"
ON project_comments FOR SELECT
TO public
USING (is_approved = true);

-- Allow authenticated users to view their own comments
CREATE POLICY "Allow users to view their own comments"
ON project_comments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to create comments
CREATE POLICY "Allow authenticated users to create comments"
ON project_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Allow users to update their own comments"
ON project_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Allow users to delete their own comments"
ON project_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to manage all comments
CREATE POLICY "Allow admins to manage all comments"
ON project_comments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

