import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { DatabaseSeeder } from './database.seeder';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ResponseUtil } from '../core/utils/response';
import { TranslationUtil } from '../core/utils/translations';

@Controller('seeders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SeedersController {
  constructor(private readonly databaseSeeder: DatabaseSeeder) {}

  @Post('run')
  async runSeeders(
    @Body() body?: { clearPermissions?: boolean },
  ): Promise<any> {
    try {
      const clearPermissions = body?.clearPermissions || false;
      await this.databaseSeeder.seed(clearPermissions);

      return ResponseUtil.success(
        null,
        TranslationUtil.translate('seeders.success', 'en'),
        'en',
      );
    } catch (error) {
      return ResponseUtil.error(
        TranslationUtil.translate('seeders.error', 'en'),
        'en',
        error.message,
      );
    }
  }
}
