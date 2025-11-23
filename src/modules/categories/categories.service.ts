import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { ICategory } from '../projects/types/project.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService extends BaseService {
  async findAll(): Promise<ICategory[]> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw new BadRequestException('categories.findAll.failed');
    }

    return (data || []).map((cat) => this.mapToCategory(cat));
  }

  async findOne(id: string): Promise<ICategory> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('categories.findOne.notFound');
    }

    return this.mapToCategory(data);
  }

  async create(createDto: CreateCategoryDto): Promise<ICategory> {
    const supabase = this.getClient();

    // Check if slug already exists
    if (await this.exists('categories', 'slug', createDto.slug)) {
      throw new ConflictException('categories.create.slugExists');
    }

    // Create category
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        slug: createDto.slug,
        name: createDto.name,
        description: createDto.description || null,
        icon: createDto.icon || null,
        order_index: createDto.orderIndex || 0,
      })
      .select()
      .single();

    if (error || !category) {
      throw new BadRequestException('categories.create.failed');
    }

    return this.mapToCategory(category);
  }

  async update(id: string, updateDto: UpdateCategoryDto): Promise<ICategory> {
    const supabase = this.getClient();

    // Check if exists
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('categories.update.notFound');
    }

    // Check if slug already exists (if changing)
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      if (await this.exists('categories', 'slug', updateDto.slug, id)) {
        throw new ConflictException('categories.update.slugExists');
      }
    }

    // Update category
    const updateData: any = {};
    if (updateDto.slug !== undefined) updateData.slug = updateDto.slug;
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.icon !== undefined) updateData.icon = updateDto.icon;
    if (updateDto.orderIndex !== undefined) updateData.order_index = updateDto.orderIndex;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new BadRequestException('categories.update.failed');
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException('categories.delete.failed');
    }
  }

  private mapToCategory(data: any): ICategory {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      icon: data.icon,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

