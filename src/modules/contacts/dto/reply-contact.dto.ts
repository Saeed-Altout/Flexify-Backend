import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReplyContactDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

