import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: string;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  // Database Configuration
  @IsString()
  DB_HOST: string;

  @Type(() => Number)
  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASS: string;

  @IsString()
  DB_NAME: string;

  // JWT Configuration
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  // Mail Configuration
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

  // CORS Configuration
  @IsString()
  @Transform(({ value }) => value.split(',').map((url: string) => url.trim()))
  @IsArray()
  FRONTEND_URL: string[];

  // Base URL Configuration
  @IsString()
  @IsOptional()
  BASE_URL?: string;
}
