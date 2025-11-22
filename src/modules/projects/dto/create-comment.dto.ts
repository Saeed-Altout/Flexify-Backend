import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID('4')
  projectId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}

