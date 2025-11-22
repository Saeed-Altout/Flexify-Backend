import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, SupabaseService],
  exports: [ContactsService],
})
export class ContactsModule {}

