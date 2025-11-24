import { IsString, IsObject, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateSiteSettingDto {
  @IsOptional()
  @IsObject()
  value?: Record<string, any>;
}

export class UpdateSiteSettingTranslationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  locale: string;

  @IsObject()
  value: Record<string, any>;
}

