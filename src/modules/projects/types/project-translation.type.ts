/**
 * Project translation entity type
 */
export interface ProjectTranslation {
  id: string;
  project_id: string;
  language: 'en' | 'ar';
  title: string;
  summary: string;
  description: string;
  architecture: string | null;
  features: string[];
  created_at: Date | string;
  updated_at: Date | string;
}
