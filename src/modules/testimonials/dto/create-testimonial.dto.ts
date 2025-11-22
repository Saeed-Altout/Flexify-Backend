import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTestimonialTranslationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  locale: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  authorName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorPosition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;
}

export class CreateTestimonialDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  // Translations (required - at least one)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestimonialTranslationDto)
  translations: CreateTestimonialTranslationDto[];
}

