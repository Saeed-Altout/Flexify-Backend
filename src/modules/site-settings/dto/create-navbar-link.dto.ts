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

export class CreateNavbarLinkTranslationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  locale: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label: string;
}

export class CreateNavbarLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  href: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNavbarLinkTranslationDto)
  translations: CreateNavbarLinkTranslationDto[];
}

