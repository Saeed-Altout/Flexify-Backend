import { User } from '../../users/types/user.type';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  user?: User;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

