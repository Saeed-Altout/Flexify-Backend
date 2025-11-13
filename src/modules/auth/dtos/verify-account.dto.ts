import { IsString, Length, Matches } from 'class-validator';

export class VerifyAccountDto {
  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  code: string;

  @IsString()
  email: string;
}

