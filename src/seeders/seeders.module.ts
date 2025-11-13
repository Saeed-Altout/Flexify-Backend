import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeeder } from './database.seeder';
import { SeedersController } from './seeders.controller';
import { User } from '../modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SeedersController],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class SeedersModule {}
