import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  verificationToken: string; // UUID token from registration

  @IsString()
  otp: string; // 6-digit OTP code
}
