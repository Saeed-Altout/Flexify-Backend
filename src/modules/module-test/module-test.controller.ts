import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModuleTestService } from './module-test.service';
import { ModuleTest } from '../../common/entities/module-test.entity';

@Controller('module-test')
export class ModuleTestController {
  constructor(private readonly moduleTestService: ModuleTestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body('name') name: string,
    @Body('description') description?: string,
  ): Promise<ModuleTest> {
    return await this.moduleTestService.create(name, description);
  }

  @Get()
  async findAll(): Promise<ModuleTest[]> {
    return await this.moduleTestService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ModuleTest> {
    return await this.moduleTestService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('description') description?: string,
  ): Promise<ModuleTest> {
    return await this.moduleTestService.update(id, name, description);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.moduleTestService.remove(id);
  }
}
