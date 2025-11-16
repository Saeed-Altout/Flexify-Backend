import { Project } from './project.type';
import { ProjectTranslation } from './project-translation.type';

/**
 * Project with translations and user info
 */
export interface ProjectWithRelations extends Project {
  translations?: ProjectTranslation[];
  user_liked?: boolean;
  user_rating?: number | null;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}
