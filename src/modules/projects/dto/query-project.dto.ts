import { IsOptional, IsString, IsNumber, IsEnum, Min, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectType } from '../enums/project-type.enum';

export enum ProjectSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  TITLE = 'title',
  VIEW_COUNT = 'view_count',
  LIKE_COUNT = 'like_count',
  ORDER_INDEX = 'order_index',
  START_DATE = 'start_date',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryProjectDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  technologyId?: string;

  @IsOptional()
  @IsString()
  locale?: string;

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
  @IsEnum(ProjectSortBy)
  sortBy?: ProjectSortBy = ProjectSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

