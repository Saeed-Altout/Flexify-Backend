import { IsString, IsBoolean, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProjectsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  tech_stack?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_published?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  @IsIn(['created_at', 'updated_at', 'average_rating', 'total_likes', 'total_ratings'])
  sort_by?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}

