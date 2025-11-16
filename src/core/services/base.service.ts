import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../lib/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Base service class to reduce code duplication
 * Provides common functionality for all services
 */
@Injectable()
export abstract class BaseService {
  constructor(protected readonly supabaseService: SupabaseService) {}

  /**
   * Get Supabase client instance
   */
  protected getClient(): SupabaseClient {
    return this.supabaseService.getClient();
  }

  /**
   * Check if a value exists in database
   */
  protected async exists(
    table: string,
    column: string,
    value: any,
    excludeId?: string,
  ): Promise<boolean> {
    const supabase = this.getClient();
    let query = supabase.from(table).select('id').eq(column, value).limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      return false;
    }

    return (data?.length ?? 0) > 0;
  }
}

