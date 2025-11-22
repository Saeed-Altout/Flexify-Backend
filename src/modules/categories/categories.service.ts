import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { ICategory } from '../projects/types/project.types';

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

  private mapToCategory(data: any): ICategory {
    return {
      id: data.id,
      slug: data.slug,
      nameEn: data.name_en,
      nameAr: data.name_ar,
      icon: data.icon,
      color: data.color,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

