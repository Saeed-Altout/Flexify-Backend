import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectType } from '../enums/project-type.enum';

export interface IProject {
  id: string;
  userId: string;
  slug: string;
  thumbnailUrl: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  orderIndex: number;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  translations?: IProjectTranslation[];
  images?: IProjectImage[];
  technologies?: ITechnology[];
  categories?: ICategory[];
  links?: IProjectLink[];
}

export interface IProjectTranslation {
  id: string;
  projectId: string;
  locale: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectImage {
  id: string;
  projectId: string;
  imageUrl: string;
  altText: string | null;
  orderIndex: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITechnology {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  category: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectLink {
  id: string;
  projectId: string;
  linkType: string;
  url: string;
  label: string | null;
  icon: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectInteraction {
  id: string;
  projectId: string;
  userId: string;
  interactionType: string;
  createdAt: string;
}

export interface IProjectComment {
  id: string;
  projectId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  replies?: IProjectComment[];
}

export interface IProjectsListResponse {
  projects: IProject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProjectDetailResponse {
  project: IProject;
  userInteraction?: {
    hasLiked: boolean;
    hasShared: boolean;
  };
}

