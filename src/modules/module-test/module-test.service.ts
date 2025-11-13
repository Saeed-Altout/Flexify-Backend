import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleTest } from '../../common/entities/module-test.entity';

@Injectable()
export class ModuleTestService {
  constructor(
    @InjectRepository(ModuleTest)
    private readonly moduleTestRepository: Repository<ModuleTest>,
  ) {}

  async create(name: string, description?: string): Promise<ModuleTest> {
    const moduleTest = this.moduleTestRepository.create({ name, description });
    return await this.moduleTestRepository.save(moduleTest);
  }

  async findAll(): Promise<ModuleTest[]> {
    return await this.moduleTestRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ModuleTest> {
    const moduleTest = await this.moduleTestRepository.findOne({ where: { id } });
    if (!moduleTest) {
      throw new NotFoundException(`ModuleTest with ID ${id} not found`);
    }
    return moduleTest;
  }

  async update(
    id: string,
    name?: string,
    description?: string,
  ): Promise<ModuleTest> {
    const moduleTest = await this.findOne(id);

    if (name) moduleTest.name = name;
    if (description !== undefined) moduleTest.description = description;

    return await this.moduleTestRepository.save(moduleTest);
  }

  async remove(id: string): Promise<void> {
    const result = await this.moduleTestRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ModuleTest with ID ${id} not found`);
    }
  }
}

