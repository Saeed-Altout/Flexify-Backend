import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class UploadProjectImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

