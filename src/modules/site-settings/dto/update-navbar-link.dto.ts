import { PartialType } from '@nestjs/mapped-types';
import { CreateNavbarLinkDto } from './create-navbar-link.dto';

export class UpdateNavbarLinkDto extends PartialType(CreateNavbarLinkDto) {}

