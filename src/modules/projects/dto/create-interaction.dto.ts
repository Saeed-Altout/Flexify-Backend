import { IsUUID, IsEnum } from 'class-validator';
import { InteractionType } from '../enums/interaction-type.enum';

export class CreateInteractionDto {
  @IsUUID('4')
  projectId: string;

  @IsEnum(InteractionType)
  interactionType: InteractionType;
}

