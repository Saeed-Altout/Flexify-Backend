import { PartialType } from '@nestjs/mapped-types';
import { CreateInquiryTypeDto } from './create-inquiry-type.dto';

export class UpdateInquiryTypeDto extends PartialType(CreateInquiryTypeDto) {}

