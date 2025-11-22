import { IsOptional, IsBoolean, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum InquiryTypeSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  ORDER_INDEX = 'order_index',
  NAME = 'name',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryInquiryTypeDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsEnum(InquiryTypeSortBy)
  sortBy?: InquiryTypeSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

