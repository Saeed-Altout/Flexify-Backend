export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';
export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  id: string;
  email: string;
  password_hash?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  provider?: string | null;
  provider_id?: string | null;
  language: string;
  timezone?: string | null;
  metadata: Record<string, any>;
  settings: Record<string, any>;
  last_login_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;
  // Computed property for backward compatibility
  is_active?: boolean;
}

