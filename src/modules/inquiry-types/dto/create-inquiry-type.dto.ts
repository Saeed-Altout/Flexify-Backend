import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInquiryTypeTranslationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  locale: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateInquiryTypeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Translations (required - at least one)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInquiryTypeTranslationDto)
  translations: CreateInquiryTypeTranslationDto[];
}

