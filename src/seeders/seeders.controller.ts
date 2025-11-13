import { Controller, Post } from '@nestjs/common';

import { DatabaseSeeder } from './database.seeder';

import { ResponseUtil } from '../core/utils/response';
import { TranslationUtil } from '../core/utils/translations';

@Controller('seeders')
export class SeedersController {
  constructor(private readonly databaseSeeder: DatabaseSeeder) {}

  @Post('run')
  async runSeeders(): Promise<any> {
    try {
      await this.databaseSeeder.seed();

      return ResponseUtil.success(
        TranslationUtil.translate('seeders.success', 'en'),
      );
    } catch (error) {
      return ResponseUtil.error(
        TranslationUtil.translate('seeders.error', 'en'),
        error.message,
      );
    }
  }
}
