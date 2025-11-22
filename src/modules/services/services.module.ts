import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, SupabaseService],
  exports: [ServicesService],
})
export class ServicesModule {}

