/**
 * Project entity type
 */
export interface Project {
  id: string;
  user_id: string;
  tech_stack: string[];
  role: string;
  github_url: string | null;
  github_backend_url: string | null;
  live_demo_url: string | null;
  main_image: string | null;
  images: string[];
  average_rating: number;
  total_ratings: number;
  total_likes: number;
  is_published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}
