import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateInquiryTypeDto } from './dto/create-inquiry-type.dto';
import { UpdateInquiryTypeDto } from './dto/update-inquiry-type.dto';
import { QueryInquiryTypeDto, InquiryTypeSortBy, SortOrder } from './dto/query-inquiry-type.dto';
import {
  IInquiryType,
  IInquiryTypesListResponse,
} from './types/inquiry-type.types';

@Injectable()
export class InquiryTypesService extends BaseService {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 100;

  /**
   * Create a new inquiry type with translations
   */
  async create(createDto: CreateInquiryTypeDto): Promise<IInquiryType> {
    const supabase = this.getClient();

    // Check if slug already exists
    if (await this.exists('inquiry_types', 'slug', createDto.slug)) {
      throw new ConflictException('inquiryTypes.create.slugExists');
    }

    // Validate translations (at least one required)
    if (!createDto.translations || createDto.translations.length === 0) {
      throw new BadRequestException('inquiryTypes.create.translationsRequired');
    }

    // Create inquiry type
    const { data: inquiryType, error: inquiryTypeError } = await supabase
      .from('inquiry_types')
      .insert({
        slug: createDto.slug,
        icon: createDto.icon || null,
        order_index: createDto.orderIndex || 0,
        is_active: createDto.isActive !== undefined ? createDto.isActive : true,
      })
      .select()
      .single();

    if (inquiryTypeError || !inquiryType) {
      throw new BadRequestException('inquiryTypes.create.failed');
    }

    // Create translations
    const translationsData = createDto.translations.map((t) => ({
      inquiry_type_id: inquiryType.id,
      locale: t.locale,
      name: t.name,
      description: t.description || null,
    }));

    const { error: translationsError } = await supabase
      .from('inquiry_type_translations')
      .insert(translationsData);

    if (translationsError) {
      // Rollback: delete inquiry type
      await supabase.from('inquiry_types').delete().eq('id', inquiryType.id);
      throw new BadRequestException('inquiryTypes.create.translationsFailed');
    }

    return this.findOne(inquiryType.id);
  }

  /**
   * Find all inquiry types with filters
   */
  async findAll(queryDto: QueryInquiryTypeDto): Promise<IInquiryTypesListResponse> {
    const supabase = this.getClient();
    const {
      search,
      isActive,
      locale = 'en',
      sortBy = InquiryTypeSortBy.ORDER_INDEX,
      sortOrder = SortOrder.ASC,
    } = queryDto;

    let query = supabase
      .from('inquiry_types')
      .select(`
        *,
        translations:inquiry_type_translations(*)
      `, { count: 'exact' });

    // Filter by active status
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // Search in translations
    if (search) {
      query = query.or(`translations.name.ilike.%${search}%,translations.description.ilike.%${search}%`);
    }

    // Sort
    const ascending = sortOrder === SortOrder.ASC;
    query = query.order(sortBy, { ascending });

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException('inquiryTypes.findAll.failed');
    }

    const inquiryTypes = (data || []).map((item) => this.mapToInquiryType(item, locale));

    return {
      inquiryTypes,
      total: count || 0,
      page: this.DEFAULT_PAGE,
      limit: this.DEFAULT_LIMIT,
    };
  }

  /**
   * Find one inquiry type by ID
   */
  async findOne(id: string, locale: string = 'en'): Promise<IInquiryType> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('inquiry_types')
      .select(`
        *,
        translations:inquiry_type_translations(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('inquiryTypes.findOne.notFound');
    }

    return this.mapToInquiryType(data, locale);
  }

  /**
   * Find one inquiry type by slug
   */
  async findBySlug(slug: string, locale: string = 'en'): Promise<IInquiryType> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('inquiry_types')
      .select(`
        *,
        translations:inquiry_type_translations(*)
      `)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new NotFoundException('inquiryTypes.findBySlug.notFound');
    }

    return this.mapToInquiryType(data, locale);
  }

  /**
   * Update an inquiry type
   */
  async update(id: string, updateDto: UpdateInquiryTypeDto): Promise<IInquiryType> {
    const supabase = this.getClient();

    // Check if exists
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('inquiryTypes.update.notFound');
    }

    // Check if slug already exists (if changing)
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      if (await this.exists('inquiry_types', 'slug', updateDto.slug, id)) {
        throw new ConflictException('inquiryTypes.update.slugExists');
      }
    }

    // Update inquiry type
    const updateData: any = {};
    if (updateDto.slug !== undefined) updateData.slug = updateDto.slug;
    if (updateDto.icon !== undefined) updateData.icon = updateDto.icon;
    if (updateDto.orderIndex !== undefined) updateData.order_index = updateDto.orderIndex;
    if (updateDto.isActive !== undefined) updateData.is_active = updateDto.isActive;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('inquiry_types')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new BadRequestException('inquiryTypes.update.failed');
      }
    }

    // Update translations
    if (updateDto.translations && updateDto.translations.length > 0) {
      // Delete existing translations
      await supabase
        .from('inquiry_type_translations')
        .delete()
        .eq('inquiry_type_id', id);

      // Insert new translations
      const translationsData = updateDto.translations.map((t) => ({
        inquiry_type_id: id,
        locale: t.locale,
        name: t.name,
        description: t.description || null,
      }));

      const { error: translationsError } = await supabase
        .from('inquiry_type_translations')
        .insert(translationsData);

      if (translationsError) {
        throw new BadRequestException('inquiryTypes.update.translationsFailed');
      }
    }

    return this.findOne(id);
  }

  /**
   * Delete an inquiry type
   */
  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const { error } = await supabase
      .from('inquiry_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException('inquiryTypes.delete.failed');
    }
  }

  /**
   * Map database row to IInquiryType
   */
  private mapToInquiryType(data: any, locale: string = 'en'): IInquiryType {
    const translations = data.translations || [];
    const translation = translations.find((t: any) => t.locale === locale) || translations[0] || {};

    return {
      id: data.id,
      slug: data.slug,
      icon: data.icon,
      orderIndex: data.order_index,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      translations: translations.map((t: any) => ({
        id: t.id,
        inquiryTypeId: t.inquiry_type_id,
        locale: t.locale,
        name: t.name,
        description: t.description,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    };
  }
}

