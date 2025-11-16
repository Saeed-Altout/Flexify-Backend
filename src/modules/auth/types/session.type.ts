import { User } from '../../users/types/user.type';

export interface Session {
  id: string;
  user_id: string;
  user?: User;
  session_token: string;
  ip_address?: string | null;
  user_agent?: string | null;
  device_name?: string | null;
  expires_at: Date;
  revoked_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

