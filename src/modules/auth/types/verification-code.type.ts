export interface VerificationCode {
  id: string;
  user_id: string;
  code: string;
  type: 'email' | 'phone';
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

