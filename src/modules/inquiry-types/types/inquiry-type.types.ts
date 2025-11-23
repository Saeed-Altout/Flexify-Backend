export interface IInquiryTypeTranslation {
  id: string;
  inquiryTypeId: string;
  locale: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IInquiryType {
  id: string;
  slug: string;
  icon: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations?: IInquiryTypeTranslation[];
}

export interface IInquiryTypesListResponse {
  inquiryTypes: IInquiryType[];
  total: number;
  page: number;
  limit: number;
}

