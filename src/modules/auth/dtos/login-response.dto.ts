export class LoginResponseDto {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    email_verified: boolean;
  };
  session_token: string;
}
