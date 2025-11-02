import { Module } from '@nestjs/common';
import { DatabaseSeeder } from './database.seeder';
import { SeedersController } from './seeders.controller';

@Module({
  imports: [],
  controllers: [SeedersController],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class SeedersModule {}
