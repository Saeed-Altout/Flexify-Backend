import { Module } from '@nestjs/common';
import { InquiryTypesService } from './inquiry-types.service';
import { InquiryTypesController } from './inquiry-types.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [InquiryTypesController],
  providers: [InquiryTypesService, SupabaseService],
  exports: [InquiryTypesService],
})
export class InquiryTypesModule {}

