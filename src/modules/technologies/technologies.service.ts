import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { ITechnology } from '../projects/types/project.types';

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

  private mapToTechnology(data: any): ITechnology {
    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      icon: data.icon,
      color: data.color,
      category: data.category,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

