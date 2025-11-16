import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: string;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  // Supabase Configuration
  @IsString()
  SUPABASE_URL: string;

  @IsString()
  SUPABASE_SERVICE_ROLE_KEY: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  @IsString()
  MAIL_HOST: string;

  @Type(() => Number)
  @IsNumber()
  MAIL_PORT: number;

  @IsString()
  MAIL_USER: string;

  @IsString()
  MAIL_PASS: string;

  @IsString()
  MAIL_FROM: string;

  @IsString()
  FRONTEND_URL: string;

  @IsOptional()
  @IsString()
  BASE_URL?: string;

  @IsOptional()
  @IsString()
  MULTER_DESTINATION?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  MULTER_MAX_FILE_SIZE?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  MULTER_MAX_FILES?: number;
}
