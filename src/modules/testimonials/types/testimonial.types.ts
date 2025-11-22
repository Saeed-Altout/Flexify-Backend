export interface ITestimonialTranslation {
  id: string;
  testimonialId: string;
  locale: string;
  content: string;
  authorName: string;
  authorPosition: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITestimonial {
  id: string;
  avatarUrl: string | null;
  rating: number | null;
  isFeatured: boolean;
  isApproved: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  translations?: ITestimonialTranslation[];
}

export interface ITestimonialsListResponse {
  testimonials: ITestimonial[];
  total: number;
  page: number;
  limit: number;
}

