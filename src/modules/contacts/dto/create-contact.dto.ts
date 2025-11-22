import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ContactStatus } from '../enums/contact-status.enum';

export class CreateContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsUUID('4')
  inquiryTypeId?: string;
}

