import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, SupabaseService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

