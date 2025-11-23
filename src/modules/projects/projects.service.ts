import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto, ProjectSortBy, SortOrder } from './dto/query-project.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import {
  IProject,
  IProjectsListResponse,
  IProjectDetailResponse,
  IProjectComment,
  IProjectInteraction,
} from './types/project.types';
import { ProjectStatus } from './enums/project-status.enum';

@Injectable()
export class ProjectsService extends BaseService {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;

  /**
   * Create a new project with translations, technologies, categories, and links
   */
  async create(createProjectDto: CreateProjectDto, userId: string): Promise<IProject> {
    const supabase = this.getClient();

    // Check if slug already exists
    if (await this.exists('projects', 'slug', createProjectDto.slug)) {
      throw new ConflictException('projects.create.slugExists');
    }

    // Validate translations (at least one required)
    if (!createProjectDto.translations || createProjectDto.translations.length === 0) {
      throw new BadRequestException('projects.create.translationsRequired');
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        slug: createProjectDto.slug,
        thumbnail_url: null,
        project_type: createProjectDto.projectType || 'personal',
        status: createProjectDto.status || ProjectStatus.DRAFT,
        order_index: createProjectDto.orderIndex || 0,
        is_featured: createProjectDto.isFeatured || false,
        start_date: createProjectDto.startDate || null,
        end_date: createProjectDto.endDate || null,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new BadRequestException('projects.create.failed');
    }

    // Create translations
    const translationsData = createProjectDto.translations.map((t) => ({
      project_id: project.id,
      locale: t.locale,
      title: t.title,
      description: t.description || null,
      short_description: t.shortDescription || null,
      content: t.content || null,
      meta_title: t.metaTitle || null,
      meta_description: t.metaDescription || null,
    }));

    const { error: translationsError } = await supabase
      .from('project_translations')
      .insert(translationsData);

    if (translationsError) {
      // Rollback: delete project
      await supabase.from('projects').delete().eq('id', project.id);
      throw new BadRequestException('projects.create.translationsFailed');
    }

    // Add technologies
    if (createProjectDto.technologyIds && createProjectDto.technologyIds.length > 0) {
      const technologiesData = createProjectDto.technologyIds.map((techId) => ({
        project_id: project.id,
        technology_id: techId,
      }));

      await supabase.from('project_technologies').insert(technologiesData);
    }

    // Add categories
    if (createProjectDto.categoryIds && createProjectDto.categoryIds.length > 0) {
      const categoriesData = createProjectDto.categoryIds.map((catId) => ({
        project_id: project.id,
        category_id: catId,
      }));

      await supabase.from('project_categories').insert(categoriesData);
    }

    // Add links
    if (createProjectDto.links && createProjectDto.links.length > 0) {
      const linksData = createProjectDto.links.map((link, index) => ({
        project_id: project.id,
        link_type: link.linkType,
        url: link.url,
        label: link.label || null,
        icon: link.icon || null,
        order_index: link.orderIndex || index,
      }));

      await supabase.from('project_links').insert(linksData);
    }

    // Add images
    if (createProjectDto.imageUrls && createProjectDto.imageUrls.length > 0) {
      const imagesData = createProjectDto.imageUrls.map((url, index) => ({
        project_id: project.id,
        image_url: url,
        order_index: index,
        is_primary: index === 0,
      }));

      await supabase.from('project_images').insert(imagesData);
    }

    return this.findOne(project.id);
  }

  /**
   * Find all projects with filters and pagination
   */
  async findAll(queryDto: QueryProjectDto, userId?: string): Promise<IProjectsListResponse> {
    const supabase = this.getClient();
    const {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
      search,
      status,
      projectType,
      isFeatured,
      categoryId,
      technologyId,
      locale = 'en',
      sortBy = ProjectSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    // Base query with translations
    let query = supabase
      .from('projects')
      .select(
        `
        *,
        project_translations!inner(locale, title, short_description),
        project_categories(category_id),
        project_technologies(technology_id)
      `,
        { count: 'exact' },
      );

    // Filter by locale
    query = query.eq('project_translations.locale', locale);

    // Apply filters
    if (search) {
      query = query.ilike('project_translations.title', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    } else if (!userId) {
      // Public users only see published projects
      query = query.eq('status', ProjectStatus.PUBLISHED);
    }

    if (projectType) query = query.eq('project_type', projectType);
    if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured);

    // Filter by category
    if (categoryId) {
      query = query.contains('project_categories', [{ category_id: categoryId }]);
    }

    // Filter by technology
    if (technologyId) {
      query = query.contains('project_technologies', [{ technology_id: technologyId }]);
    }

    // Apply sorting
    const sortColumn = sortBy === 'title' ? 'project_translations.title' : sortBy;
    query = query.order(sortColumn, { ascending: sortOrder === SortOrder.ASC });

    // Apply pagination
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException('projects.findAll.failed');
    }

    const projects = (data || []).map((project) => this.mapToProject(project));

    return {
      projects,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Find one project by ID with all relations
   */
  async findOne(id: string, userId?: string): Promise<IProject> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        project_translations(*),
        project_images(*),
        project_links(*),
        project_technologies(
          technology_id,
          technologies(*)
        ),
        project_categories(
          category_id,
          categories(*)
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('projects.findOne.notFound');
    }

    // Check if user can view this project
    if (data.status !== ProjectStatus.PUBLISHED && !userId) {
      throw new NotFoundException('projects.findOne.notFound');
    }

    // Increment view count
    await supabase
      .from('projects')
      .update({ view_count: data.view_count + 1 })
      .eq('id', id);

    return this.mapToProjectWithRelations(data);
  }

  /**
   * Find project by slug
   */
  async findBySlug(slug: string, userId?: string): Promise<IProjectDetailResponse> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        project_translations(*),
        project_images(*),
        project_links(*),
        project_technologies(
          technology_id,
          technologies(*)
        ),
        project_categories(
          category_id,
          categories(*)
        )
      `,
      )
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new NotFoundException('projects.findBySlug.notFound');
    }

    // Check if user can view this project
    if (data.status !== ProjectStatus.PUBLISHED && !userId) {
      throw new NotFoundException('projects.findBySlug.notFound');
    }

    // Increment view count
    await supabase
      .from('projects')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id);

    const project = this.mapToProjectWithRelations(data);

    // Get user interaction if authenticated
    let userInteraction: { hasLiked: boolean; hasShared: boolean } | undefined = undefined;
    if (userId) {
      const { data: interactions } = await supabase
        .from('project_interactions')
        .select('interaction_type')
        .eq('project_id', data.id)
        .eq('user_id', userId);

      userInteraction = {
        hasLiked: interactions?.some((i) => i.interaction_type === 'like') || false,
        hasShared: interactions?.some((i) => i.interaction_type === 'share') || false,
      };
    }

    return {
      project,
      userInteraction,
    };
  }

  /**
   * Update project
   */
  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<IProject> {
    const supabase = this.getClient();

    // Check if project exists
    await this.findOne(id);

    // Build update data
    const updateData: any = {};
    if (updateProjectDto.projectType !== undefined)
      updateData.project_type = updateProjectDto.projectType;
    if (updateProjectDto.status !== undefined) updateData.status = updateProjectDto.status;
    if (updateProjectDto.orderIndex !== undefined)
      updateData.order_index = updateProjectDto.orderIndex;
    if (updateProjectDto.isFeatured !== undefined)
      updateData.is_featured = updateProjectDto.isFeatured;
    if (updateProjectDto.startDate !== undefined) updateData.start_date = updateProjectDto.startDate;
    if (updateProjectDto.endDate !== undefined) updateData.end_date = updateProjectDto.endDate;

    // Update project
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('projects').update(updateData).eq('id', id);

      if (error) {
        throw new BadRequestException('projects.update.failed');
      }
    }

    // Update translations
    if (updateProjectDto.translations) {
      for (const translation of updateProjectDto.translations) {
        const { error } = await supabase
          .from('project_translations')
          .upsert(
            {
              project_id: id,
              locale: translation.locale,
              title: translation.title,
              description: translation.description || null,
              short_description: translation.shortDescription || null,
              content: translation.content || null,
              meta_title: translation.metaTitle || null,
              meta_description: translation.metaDescription || null,
            },
            {
              onConflict: 'project_id,locale',
            }
          );

        if (error) {
          throw new BadRequestException('projects.update.translationsFailed');
        }
      }
    }

    // Update technologies
    if (updateProjectDto.technologyIds !== undefined) {
      // Delete existing
      await supabase.from('project_technologies').delete().eq('project_id', id);

      // Insert new
      if (updateProjectDto.technologyIds.length > 0) {
        const technologiesData = updateProjectDto.technologyIds.map((techId) => ({
          project_id: id,
          technology_id: techId,
        }));

        await supabase.from('project_technologies').insert(technologiesData);
      }
    }

    // Update categories
    if (updateProjectDto.categoryIds !== undefined) {
      // Delete existing
      await supabase.from('project_categories').delete().eq('project_id', id);

      // Insert new
      if (updateProjectDto.categoryIds.length > 0) {
        const categoriesData = updateProjectDto.categoryIds.map((catId) => ({
          project_id: id,
          category_id: catId,
        }));

        await supabase.from('project_categories').insert(categoriesData);
      }
    }

    // Update links
    if (updateProjectDto.links !== undefined) {
      // Delete existing
      await supabase.from('project_links').delete().eq('project_id', id);

      // Insert new
      if (updateProjectDto.links.length > 0) {
        const linksData = updateProjectDto.links.map((link, index) => ({
          project_id: id,
          link_type: link.linkType,
          url: link.url,
          label: link.label || null,
          icon: link.icon || null,
          order_index: link.orderIndex || index,
        }));

        await supabase.from('project_links').insert(linksData);
      }
    }

    return this.findOne(id);
  }

  /**
   * Delete project
   */
  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if project exists
    await this.findOne(id);

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      throw new BadRequestException('projects.delete.failed');
    }
  }

  /**
   * Upload project thumbnail
   */
  async uploadThumbnail(projectId: string, file: Express.Multer.File): Promise<string> {
    const supabase = this.getClient();

    // Check if project exists
    await this.findOne(projectId);

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${projectId}-thumbnail-${Date.now()}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('project-thumbnails')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new BadRequestException('projects.thumbnail.uploadFailed');
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('project-thumbnails').getPublicUrl(filePath);
    const thumbnailUrl = urlData.publicUrl;

    // Update project
    const { error: updateError } = await supabase
      .from('projects')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', projectId);

    if (updateError) {
      throw new BadRequestException('projects.thumbnail.uploadFailed');
    }

    return thumbnailUrl;
  }

  /**
   * Upload project image
   */
  async uploadImage(
    projectId: string,
    file: Express.Multer.File,
    altText?: string,
    orderIndex?: number,
    isPrimary?: boolean,
  ): Promise<string> {
    const supabase = this.getClient();

    // Check if project exists
    await this.findOne(projectId);

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${projectId}-${Date.now()}.${fileExt}`;
    const filePath = `projects/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException('projects.image.uploadFailed');
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(filePath);
    const imageUrl = urlData.publicUrl;

    // Save to database
    const { error: dbError } = await supabase.from('project_images').insert({
      project_id: projectId,
      image_url: imageUrl,
      alt_text: altText || null,
      order_index: orderIndex || 0,
      is_primary: isPrimary || false,
    });

    if (dbError) {
      throw new BadRequestException('projects.image.saveFailed');
    }

    return imageUrl;
  }

  /**
   * Delete project image
   */
  async deleteImage(imageId: string): Promise<void> {
    const supabase = this.getClient();

    const { error } = await supabase.from('project_images').delete().eq('id', imageId);

    if (error) {
      throw new BadRequestException('projects.image.deleteFailed');
    }
  }

  /**
   * Create or remove interaction (like/share)
   */
  async toggleInteraction(
    createInteractionDto: CreateInteractionDto,
    userId: string,
  ): Promise<{ action: 'added' | 'removed' }> {
    const supabase = this.getClient();

    // Check if interaction exists
    const { data: existing } = await supabase
      .from('project_interactions')
      .select('id')
      .eq('project_id', createInteractionDto.projectId)
      .eq('user_id', userId)
      .eq('interaction_type', createInteractionDto.interactionType)
      .maybeSingle();

    if (existing) {
      // Remove interaction
      await supabase.from('project_interactions').delete().eq('id', existing.id);

      // Decrement count
      const countField =
        createInteractionDto.interactionType === 'like' ? 'like_count' : 'share_count';
      await supabase.rpc('decrement_project_count', {
        project_id: createInteractionDto.projectId,
        count_field: countField,
      });

      return { action: 'removed' };
    } else {
      // Add interaction
      await supabase.from('project_interactions').insert({
        project_id: createInteractionDto.projectId,
        user_id: userId,
        interaction_type: createInteractionDto.interactionType,
      });

      // Increment count
      const countField =
        createInteractionDto.interactionType === 'like' ? 'like_count' : 'share_count';
      const { data: project } = await supabase
        .from('projects')
        .select(countField)
        .eq('id', createInteractionDto.projectId)
        .single();

      if (project) {
        await supabase
          .from('projects')
          .update({ [countField]: project[countField] + 1 })
          .eq('id', createInteractionDto.projectId);
      }

      return { action: 'added' };
    }
  }

  /**
   * Get project comments
   */
  async getComments(projectId: string): Promise<IProjectComment[]> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('project_comments')
      .select(
        `
        *,
        users(id, first_name, last_name, avatar_url)
      `,
      )
      .eq('project_id', projectId)
      .eq('is_approved', true)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException('projects.comments.fetchFailed');
    }

    return (data || []).map((comment) => this.mapToComment(comment));
  }

  /**
   * Create comment
   */
  async createComment(createCommentDto: CreateCommentDto, userId: string): Promise<IProjectComment> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('project_comments')
      .insert({
        project_id: createCommentDto.projectId,
        user_id: userId,
        parent_id: createCommentDto.parentId || null,
        content: createCommentDto.content,
        is_approved: false, // Requires admin approval
      })
      .select(
        `
        *,
        users(id, first_name, last_name, avatar_url)
      `,
      )
      .single();

    if (error || !data) {
      throw new BadRequestException('projects.comments.createFailed');
    }

    // Increment comment count
    const { data: project } = await supabase
      .from('projects')
      .select('comment_count')
      .eq('id', createCommentDto.projectId)
      .single();

    if (project) {
      await supabase
        .from('projects')
        .update({ comment_count: project.comment_count + 1 })
        .eq('id', createCommentDto.projectId);
    }

    return this.mapToComment(data);
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const supabase = this.getClient();

    // Check ownership
    const { data: comment } = await supabase
      .from('project_comments')
      .select('user_id, project_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      throw new BadRequestException('projects.comments.unauthorized');
    }

    const { error } = await supabase.from('project_comments').delete().eq('id', commentId);

    if (error) {
      throw new BadRequestException('projects.comments.deleteFailed');
    }

    // Decrement comment count
    const { data: project } = await supabase
      .from('projects')
      .select('comment_count')
      .eq('id', comment.project_id)
      .single();

    if (project && project.comment_count > 0) {
      await supabase
        .from('projects')
        .update({ comment_count: project.comment_count - 1 })
        .eq('id', comment.project_id);
    }
  }

  /**
   * Map database row to IProject
   */
  private mapToProject(data: any): IProject {
    return {
      id: data.id,
      userId: data.user_id,
      slug: data.slug,
      thumbnailUrl: data.thumbnail_url,
      projectType: data.project_type,
      status: data.status,
      orderIndex: data.order_index,
      isFeatured: data.is_featured,
      viewCount: data.view_count,
      likeCount: data.like_count,
      shareCount: data.share_count,
      commentCount: data.comment_count,
      startDate: data.start_date,
      endDate: data.end_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      translations: data.project_translations
        ? data.project_translations.map((t: any) => ({
            id: t.id,
            projectId: t.project_id,
            locale: t.locale,
            title: t.title,
            description: t.description,
            shortDescription: t.short_description,
            content: t.content,
            metaTitle: t.meta_title,
            metaDescription: t.meta_description,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          }))
        : [],
    };
  }

  /**
   * Map database row to IProject with all relations
   */
  private mapToProjectWithRelations(data: any): IProject {
    const project = this.mapToProject(data);

    // Map images
    if (data.project_images) {
      project.images = data.project_images.map((img: any) => ({
        id: img.id,
        projectId: img.project_id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        orderIndex: img.order_index,
        isPrimary: img.is_primary,
        createdAt: img.created_at,
        updatedAt: img.updated_at,
      }));
    }

    // Map technologies
    if (data.project_technologies) {
      project.technologies = data.project_technologies
        .filter((pt: any) => pt.technologies)
        .map((pt: any) => ({
          id: pt.technologies.id,
          slug: pt.technologies.slug,
          name: pt.technologies.name,
          icon: pt.technologies.icon,
          color: pt.technologies.color,
          category: pt.technologies.category,
          orderIndex: pt.technologies.order_index,
          createdAt: pt.technologies.created_at,
          updatedAt: pt.technologies.updated_at,
        }));
    }

    // Map categories
    if (data.project_categories) {
      project.categories = data.project_categories
        .filter((pc: any) => pc.categories)
        .map((pc: any) => ({
          id: pc.categories.id,
          slug: pc.categories.slug,
          name: pc.categories.name,
          description: pc.categories.description,
          icon: pc.categories.icon,
          orderIndex: pc.categories.order_index,
          createdAt: pc.categories.created_at,
          updatedAt: pc.categories.updated_at,
        }));
    }

    // Map links
    if (data.project_links) {
      project.links = data.project_links.map((link: any) => ({
        id: link.id,
        projectId: link.project_id,
        linkType: link.link_type,
        url: link.url,
        label: link.label,
        icon: link.icon,
        orderIndex: link.order_index,
        createdAt: link.created_at,
        updatedAt: link.updated_at,
      }));
    }

    return project;
  }

  /**
   * Map database row to IProjectComment
   */
  private mapToComment(data: any): IProjectComment {
    return {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      parentId: data.parent_id,
      content: data.content,
      isApproved: data.is_approved,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      user: data.users
        ? {
            id: data.users.id,
            firstName: data.users.first_name,
            lastName: data.users.last_name,
            avatarUrl: data.users.avatar_url,
          }
        : undefined,
    };
  }
}

