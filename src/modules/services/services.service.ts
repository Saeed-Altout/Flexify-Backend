import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto, ServiceSortBy, SortOrder } from './dto/query-service.dto';
import {
  IService,
  IServicesListResponse,
} from './types/service.types';

@Injectable()
export class ServicesService extends BaseService {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;

  /**
   * Create a new service with translations
   */
  async create(createDto: CreateServiceDto): Promise<IService> {
    const supabase = this.getClient();

    // Check if slug already exists
    if (await this.exists('services', 'slug', createDto.slug)) {
      throw new ConflictException('services.create.slugExists');
    }

    // Validate translations (at least one required)
    if (!createDto.translations || createDto.translations.length === 0) {
      throw new BadRequestException('services.create.translationsRequired');
    }

    // Create service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .insert({
        slug: createDto.slug,
        icon: createDto.icon || null,
        image_url: createDto.imageUrl || null,
        order_index: createDto.orderIndex || 0,
        is_featured: createDto.isFeatured || false,
        is_active: createDto.isActive !== undefined ? createDto.isActive : true,
      })
      .select()
      .single();

    if (serviceError || !service) {
      throw new BadRequestException('services.create.failed');
    }

    // Create translations
    const translationsData = createDto.translations.map((t) => ({
      service_id: service.id,
      locale: t.locale,
      name: t.name,
      description: t.description || null,
      short_description: t.shortDescription || null,
      content: t.content || null,
      meta_title: t.metaTitle || null,
      meta_description: t.metaDescription || null,
    }));

    const { error: translationsError } = await supabase
      .from('service_translations')
      .insert(translationsData);

    if (translationsError) {
      // Rollback: delete service
      await supabase.from('services').delete().eq('id', service.id);
      throw new BadRequestException('services.create.translationsFailed');
    }

    return this.findOne(service.id);
  }

  /**
   * Upload service image
   */
  async uploadImage(serviceId: string, file: Express.Multer.File): Promise<string> {
    const supabase = this.getClient();
    await this.findOne(serviceId); // Ensure service exists

    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
    const filePath = `services/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException('services.image.uploadFailed');
    }

    const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(filePath);
    const imageUrl = urlData.publicUrl;

    // Update service with new image URL
    await this.update(serviceId, { imageUrl });

    return imageUrl;
  }

  /**
   * Find all services with filters and pagination
   */
  async findAll(queryDto: QueryServiceDto): Promise<IServicesListResponse> {
    const supabase = this.getClient();
    const {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
      search,
      isFeatured,
      isActive,
      locale = 'en',
      sortBy = ServiceSortBy.ORDER_INDEX,
      sortOrder = SortOrder.ASC,
    } = queryDto;

    let query = supabase
      .from('services')
      .select(`
        *,
        translations:service_translations(*)
      `, { count: 'exact' });

    // Filter by featured
    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }

    // Filter by active
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // Search in translations
    if (search) {
      query = query.or(`translations.name.ilike.%${search}%,translations.description.ilike.%${search}%,translations.short_description.ilike.%${search}%`);
    }

    // Sort
    const ascending = sortOrder === SortOrder.ASC;
    query = query.order(sortBy, { ascending });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException('services.findAll.failed');
    }

    const services = (data || []).map((item) => this.mapToService(item, locale));

    return {
      services,
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Find one service by ID
   */
  async findOne(id: string, locale: string = 'en'): Promise<IService> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        translations:service_translations(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('services.findOne.notFound');
    }

    return this.mapToService(data, locale);
  }

  /**
   * Find one service by slug
   */
  async findBySlug(slug: string, locale: string = 'en'): Promise<IService> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        translations:service_translations(*)
      `)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new NotFoundException('services.findBySlug.notFound');
    }

    return this.mapToService(data, locale);
  }

  /**
   * Update a service
   */
  async update(id: string, updateDto: UpdateServiceDto): Promise<IService> {
    const supabase = this.getClient();

    // Check if exists
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('services.update.notFound');
    }

    // Check if slug already exists (if changing)
    if (updateDto.slug && updateDto.slug !== existing.slug) {
      if (await this.exists('services', 'slug', updateDto.slug, id)) {
        throw new ConflictException('services.update.slugExists');
      }
    }

    // Update service
    const updateData: any = {};
    if (updateDto.slug !== undefined) updateData.slug = updateDto.slug;
    if (updateDto.icon !== undefined) updateData.icon = updateDto.icon;
    if (updateDto.imageUrl !== undefined) updateData.image_url = updateDto.imageUrl;
    if (updateDto.orderIndex !== undefined) updateData.order_index = updateDto.orderIndex;
    if (updateDto.isFeatured !== undefined) updateData.is_featured = updateDto.isFeatured;
    if (updateDto.isActive !== undefined) updateData.is_active = updateDto.isActive;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new BadRequestException('services.update.failed');
      }
    }

    // Update translations
    if (updateDto.translations && updateDto.translations.length > 0) {
      // Delete existing translations
      await supabase
        .from('service_translations')
        .delete()
        .eq('service_id', id);

      // Insert new translations
      const translationsData = updateDto.translations.map((t) => ({
        service_id: id,
        locale: t.locale,
        name: t.name,
        description: t.description || null,
        short_description: t.shortDescription || null,
        content: t.content || null,
        meta_title: t.metaTitle || null,
        meta_description: t.metaDescription || null,
      }));

      const { error: translationsError } = await supabase
        .from('service_translations')
        .insert(translationsData);

      if (translationsError) {
        throw new BadRequestException('services.update.translationsFailed');
      }
    }

    return this.findOne(id);
  }

  /**
   * Delete a service
   */
  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException('services.delete.failed');
    }
  }

  /**
   * Map database row to IService
   */
  private mapToService(data: any, locale: string = 'en'): IService {
    const translations = data.translations || [];
    const translation = translations.find((t: any) => t.locale === locale) || translations[0] || {};

    return {
      id: data.id,
      slug: data.slug,
      icon: data.icon,
      imageUrl: data.image_url,
      orderIndex: data.order_index,
      isFeatured: data.is_featured,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      translations: translations.map((t: any) => ({
        id: t.id,
        serviceId: t.service_id,
        locale: t.locale,
        name: t.name,
        description: t.description,
        shortDescription: t.short_description,
        content: t.content,
        metaTitle: t.meta_title,
        metaDescription: t.meta_description,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    };
  }
}

