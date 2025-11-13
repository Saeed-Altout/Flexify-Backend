import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleTest } from '../../common/entities/module-test.entity';
import { ModuleTestController } from './module-test.controller';
import { ModuleTestService } from './module-test.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleTest])],
  controllers: [ModuleTestController],
  providers: [ModuleTestService],
  exports: [ModuleTestService],
})
export class ModuleTestModule {}

