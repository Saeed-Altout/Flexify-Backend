/**
 * Project like entity type
 */
export interface ProjectLike {
  id: string;
  project_id: string;
  user_id: string;
  created_at: Date | string;
}
