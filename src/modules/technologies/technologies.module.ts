import { Module } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { TechnologiesController } from './technologies.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [TechnologiesController],
  providers: [TechnologiesService, SupabaseService],
  exports: [TechnologiesService],
})
export class TechnologiesModule {}

