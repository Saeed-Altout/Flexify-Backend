import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectType } from '../enums/project-type.enum';
import { LinkType } from '../enums/link-type.enum';

export class CreateProjectTranslationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  locale: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;
}

export class CreateProjectLinkDto {
  @IsEnum(LinkType)
  linkType: LinkType;

  @IsString()
  @MinLength(1)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Translations (required - at least one)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTranslationDto)
  translations: CreateProjectTranslationDto[];

  // Technology IDs
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technologyIds?: string[];

  // Category IDs
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  // Links
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectLinkDto)
  links?: CreateProjectLinkDto[];

  // Image URLs (for gallery)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

