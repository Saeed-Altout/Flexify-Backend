import {
  IsString,
  IsArray,
  IsOptional,
  IsUrl,
  IsBoolean,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectTranslationDto {
  @IsString()
  language: string; // 'en' or 'ar'

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  summary: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsString()
  @IsOptional()
  architecture?: string;
}

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug: string;

  @IsString()
  @MinLength(1)
  summary: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  tech_stack: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  role: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @IsString()
  @IsOptional()
  architecture?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  challenges?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  solutions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lessons?: string[];

  @IsUrl()
  @IsOptional()
  github_url?: string;

  @IsUrl()
  @IsOptional()
  github_backend_url?: string;

  @IsUrl()
  @IsOptional()
  live_demo_url?: string;

  @IsUrl()
  @IsOptional()
  video_demo_url?: string;

  @IsString()
  @IsOptional()
  main_image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectTranslationDto)
  @IsOptional()
  translations?: ProjectTranslationDto[];
}

