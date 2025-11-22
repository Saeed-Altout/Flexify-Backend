export interface IServiceTranslation {
  id: string;
  serviceId: string;
  locale: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IService {
  id: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  color: string | null;
  orderIndex: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations?: IServiceTranslation[];
}

export interface IServicesListResponse {
  services: IService[];
  total: number;
  page: number;
  limit: number;
}

