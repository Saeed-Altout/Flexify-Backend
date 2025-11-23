import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { ITechnology } from '../projects/types/project.types';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';

@Injectable()
export class TechnologiesService extends BaseService {
  async findAll(): Promise<ITechnology[]> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('technologies')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw new BadRequestException('technologies.findAll.failed');
    }

    return (data || []).map((tech) => this.mapToTechnology(tech));
  }

  async findOne(id: string): Promise<ITechnology> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('technologies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('technologies.findOne.notFound');
    }

    return this.mapToTechnology(data);
  }

  async findByCategory(category: string): Promise<ITechnology[]> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('technologies')
      .select('*')
      .eq('category', category)
      .order('order_index', { ascending: true });

    if (error) {
      throw new BadRequestException('technologies.findByCategory.failed');
    }

    return (data || []).map((tech) => this.mapToTechnology(tech));
  }

  async create(createDto: CreateTechnologyDto): Promise<ITechnology> {
    const supabase = this.getClient();

    // Check if slug already exists
    if (await this.exists('technologies', 'slug', createDto.slug)) {
      throw new ConflictException('technologies.create.slugExists');
    }

    // Create technology
    const { data: technology, error } = await supabase
      .from('technologies')
      .insert({
        slug: createDto.slug,
        name: createDto.name,
        icon: createDto.icon || null,
        description: createDto.description || null,
        category: createDto.category || null,
        order_index: createDto.orderIndex || 0,
      })
      .select()
      .single();

    if (error || !technology) {
      throw new BadRequestException('technologies.create.failed');
    }

    return this.mapToTechnology(technology);
  }

  async update(id: string, updateDto: UpdateTechnologyDto): Promise<ITechnology> {
    const supabase = this.getClient();

    // Check if exists
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('technologies.update.notFound');
    }

    // Check if slug already exists (if changing)
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      if (await this.exists('technologies', 'slug', updateDto.slug, id)) {
        throw new ConflictException('technologies.update.slugExists');
      }
    }

    // Update technology
    const updateData: any = {};
    if (updateDto.slug !== undefined) updateData.slug = updateDto.slug;
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.icon !== undefined) updateData.icon = updateDto.icon;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.category !== undefined) updateData.category = updateDto.category;
    if (updateDto.orderIndex !== undefined) updateData.order_index = updateDto.orderIndex;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('technologies')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new BadRequestException('technologies.update.failed');
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const { error } = await supabase
      .from('technologies')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException('technologies.delete.failed');
    }
  }

  private mapToTechnology(data: any): ITechnology {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      icon: data.icon,
      description: data.description,
      category: data.category,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

