import { Module } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { SiteSettingsController } from './site-settings.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, SupabaseService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}

