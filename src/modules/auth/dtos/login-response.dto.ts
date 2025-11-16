export class LoginResponseDto {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    email_verified: boolean;
  };
  session_token: string;
}
