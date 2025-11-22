import { ContactStatus } from '../enums/contact-status.enum';

export interface IContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  inquiryTypeId: string | null;
  createdAt: string;
  updatedAt: string;
  inquiryType?: {
    id: string;
    slug: string;
    translations?: Array<{
      locale: string;
      name: string;
    }>;
  };
}

export interface IContactsListResponse {
  contacts: IContact[];
  total: number;
  page: number;
  limit: number;
}

