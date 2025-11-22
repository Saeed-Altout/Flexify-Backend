import { Module } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [TestimonialsController],
  providers: [TestimonialsService, SupabaseService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}

