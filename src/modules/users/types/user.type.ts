export interface User {
  id: string;
  email: string;
  password_hash?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: string;
  status: string;
  email_verified: boolean;
  phone_verified: boolean;
  provider?: string | null;
  provider_id?: string | null;
  language: string;
  timezone?: string | null;
  metadata: Record<string, any>;
  settings: Record<string, any>;
  last_login_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

