export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR' | 'user' | 'admin' | 'moderator';

export interface User {
  id: string;
  email: string;
  name?: string;
  password_hash?: string | null;
  role: UserRole | string;
  is_active?: boolean;
  status?: string;
  email_verified: boolean;
  phone_verified?: boolean;
  avatar_url?: string | null;
  cv_file_url?: string;
  cv_file_name?: string;
  cv_file_size?: number;
  cv_uploaded_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  language?: string;
  timezone?: string | null;
  metadata?: Record<string, any>;
  settings?: Record<string, any>;
  last_login_at?: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at?: string | Date | null;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

