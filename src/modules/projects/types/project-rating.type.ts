/**
 * Project rating entity type
 */
export interface ProjectRating {
  id: string;
  project_id: string;
  user_id: string;
  rating: number; // 1-5
  created_at: Date | string;
  updated_at: Date | string;
}
