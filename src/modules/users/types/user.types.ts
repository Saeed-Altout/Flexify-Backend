export interface IUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IUserResponse {
  user: IUser;
}

export interface IUsersListResponse {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

export interface IUpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  role?: string;
}

export interface IQueryUserParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'email' | 'first_name' | 'last_name';
  sortOrder?: 'asc' | 'desc';
}

