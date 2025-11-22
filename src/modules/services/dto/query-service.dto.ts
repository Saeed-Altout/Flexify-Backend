import { IsOptional, IsBoolean, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ServiceSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  ORDER_INDEX = 'order_index',
  NAME = 'name',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryServiceDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsEnum(ServiceSortBy)
  sortBy?: ServiceSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

