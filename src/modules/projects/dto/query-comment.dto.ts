import { IsOptional, IsString, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum CommentSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryCommentDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(CommentSortBy)
  sortBy?: CommentSortBy = CommentSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

