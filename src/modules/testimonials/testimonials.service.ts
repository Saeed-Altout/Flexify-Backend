import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { QueryTestimonialDto, TestimonialSortBy, SortOrder } from './dto/query-testimonial.dto';
import {
  ITestimonial,
  ITestimonialsListResponse,
} from './types/testimonial.types';

@Injectable()
export class TestimonialsService extends BaseService {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;

  /**
   * Create a new testimonial with translations
   */
  async create(createDto: CreateTestimonialDto): Promise<ITestimonial> {
    const supabase = this.getClient();

    // Validate translations (at least one required)
    if (!createDto.translations || createDto.translations.length === 0) {
      throw new BadRequestException('testimonials.create.translationsRequired');
    }

    // Create testimonial
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .insert({
        avatar_url: createDto.avatarUrl || null,
        rating: createDto.rating || null,
        is_featured: createDto.isFeatured || false,
        is_approved: createDto.isApproved || false,
        order_index: createDto.orderIndex || 0,
      })
      .select()
      .single();

    if (testimonialError || !testimonial) {
      throw new BadRequestException('testimonials.create.failed');
    }

    // Create translations
    const translationsData = createDto.translations.map((t) => ({
      testimonial_id: testimonial.id,
      locale: t.locale,
      content: t.content,
      author_name: t.authorName,
      author_position: t.authorPosition || null,
      company: t.company || null,
    }));

    const { error: translationsError } = await supabase
      .from('testimonial_translations')
      .insert(translationsData);

    if (translationsError) {
      // Rollback: delete testimonial
      await supabase.from('testimonials').delete().eq('id', testimonial.id);
      throw new BadRequestException('testimonials.create.translationsFailed');
    }

    return this.findOne(testimonial.id);
  }

  /**
   * Find all testimonials with filters and pagination
   */
  async findAll(queryDto: QueryTestimonialDto): Promise<ITestimonialsListResponse> {
    const supabase = this.getClient();
    const {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
      search,
      isFeatured,
      isApproved,
      locale = 'en',
      sortBy = TestimonialSortBy.ORDER_INDEX,
      sortOrder = SortOrder.ASC,
    } = queryDto;

    let query = supabase
      .from('testimonials')
      .select(`
        *,
        translations:testimonial_translations(*)
      `, { count: 'exact' });

    // Filter by featured
    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }

    // Filter by approved
    if (isApproved !== undefined) {
      query = query.eq('is_approved', isApproved);
    }

    // Search in translations
    if (search) {
      query = query.or(`translations.content.ilike.%${search}%,translations.author_name.ilike.%${search}%,translations.company.ilike.%${search}%`);
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
      throw new BadRequestException('testimonials.findAll.failed');
    }

    const testimonials = (data || []).map((item) => this.mapToTestimonial(item, locale));

    return {
      testimonials,
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Find one testimonial by ID
   */
  async findOne(id: string, locale: string = 'en'): Promise<ITestimonial> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select(`
        *,
        translations:testimonial_translations(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('testimonials.findOne.notFound');
    }

    return this.mapToTestimonial(data, locale);
  }

  /**
   * Update a testimonial
   */
  async update(id: string, updateDto: UpdateTestimonialDto): Promise<ITestimonial> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    // Update testimonial
    const updateData: any = {};
    if (updateDto.avatarUrl !== undefined) updateData.avatar_url = updateDto.avatarUrl;
    if (updateDto.rating !== undefined) updateData.rating = updateDto.rating;
    if (updateDto.isFeatured !== undefined) updateData.is_featured = updateDto.isFeatured;
    if (updateDto.isApproved !== undefined) updateData.is_approved = updateDto.isApproved;
    if (updateDto.orderIndex !== undefined) updateData.order_index = updateDto.orderIndex;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new BadRequestException('testimonials.update.failed');
      }
    }

    // Update translations
    if (updateDto.translations && updateDto.translations.length > 0) {
      // Delete existing translations
      await supabase
        .from('testimonial_translations')
        .delete()
        .eq('testimonial_id', id);

      // Insert new translations
      const translationsData = updateDto.translations.map((t) => ({
        testimonial_id: id,
        locale: t.locale,
        content: t.content,
        author_name: t.authorName,
        author_position: t.authorPosition || null,
        company: t.company || null,
      }));

      const { error: translationsError } = await supabase
        .from('testimonial_translations')
        .insert(translationsData);

      if (translationsError) {
        throw new BadRequestException('testimonials.update.translationsFailed');
      }
    }

    return this.findOne(id);
  }

  /**
   * Delete a testimonial
   */
  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if exists
    await this.findOne(id);

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException('testimonials.delete.failed');
    }
  }

  /**
   * Map database row to ITestimonial
   */
  private mapToTestimonial(data: any, locale: string = 'en'): ITestimonial {
    const translations = data.translations || [];
    const translation = translations.find((t: any) => t.locale === locale) || translations[0] || {};

    return {
      id: data.id,
      avatarUrl: data.avatar_url,
      rating: data.rating,
      isFeatured: data.is_featured,
      isApproved: data.is_approved,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      translations: translations.map((t: any) => ({
        id: t.id,
        testimonialId: t.testimonial_id,
        locale: t.locale,
        content: t.content,
        authorName: t.author_name,
        authorPosition: t.author_position,
        company: t.company,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    };
  }
}

