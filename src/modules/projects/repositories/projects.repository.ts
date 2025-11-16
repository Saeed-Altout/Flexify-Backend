import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../core/lib/supabase/supabase.service';
import { Project } from '../types/project.type';
import { ProjectTranslation } from '../types/project-translation.type';
import { ProjectRating } from '../types/project-rating.type';
import { ProjectLike } from '../types/project-like.type';
import { ProjectWithRelations } from '../types/project-with-relations.type';

/**
 * Projects Repository
 * Single Responsibility: Data access operations only
 */
@Injectable()
export class ProjectsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Create a new project
   */
  async create(
    data: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Project> {
    const { data: project, error } = await this.supabase.supabase
      .from('projects')
      .insert({
        user_id: data.user_id,
        tech_stack: data.tech_stack,
        role: data.role,
        github_url: data.github_url,
        github_backend_url: data.github_backend_url,
        live_demo_url: data.live_demo_url,
        main_image: data.main_image,
        images: data.images,
        is_published: data.is_published ?? false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create project: ${error.message}`);
    return this.mapProject(project);
  }

  /**
   * Find project by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Project | null> {
    let query = this.supabase.supabase
      .from('projects')
      .select('*')
      .eq('id', id);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error || !data) return null;
    return this.mapProject(data);
  }

  /**
   * Find projects with filters
   */
  async findMany(filters: {
    user_id?: string;
    is_published?: boolean;
    search?: string;
    tech_stack?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    order?: 'ASC' | 'DESC';
    includeDeleted?: boolean;
  }): Promise<{ data: Project[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    let query = this.supabase.supabase
      .from('projects')
      .select('*', { count: 'exact' });

    if (!filters.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }

    if (filters.tech_stack) {
      query = query.contains('tech_stack', [filters.tech_stack]);
    }

    if (filters.search) {
      // Search in project translations
      const { data: translationIds } = await this.supabase.supabase
        .from('project_translations')
        .select('project_id')
        .or(
          `title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );

      if (translationIds && translationIds.length > 0) {
        const projectIds = translationIds.map((t) => t.project_id);
        query = query.in('id', projectIds);
      } else {
        // Return empty result if no matches
        return { data: [], total: 0 };
      }
    }

    // Sorting
    const sortBy = filters.sort_by ?? 'created_at';
    const order = filters.order ?? 'DESC';
    query = query.order(sortBy, { ascending: order === 'ASC' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to fetch projects: ${error.message}`);

    return {
      data: (data ?? []).map((p) => this.mapProject(p)),
      total: count ?? 0,
    };
  }

  /**
   * Update project
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const updateData: any = {};

    if (updates.tech_stack !== undefined)
      updateData.tech_stack = updates.tech_stack;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.github_url !== undefined)
      updateData.github_url = updates.github_url;
    if (updates.github_backend_url !== undefined)
      updateData.github_backend_url = updates.github_backend_url;
    if (updates.live_demo_url !== undefined)
      updateData.live_demo_url = updates.live_demo_url;
    if (updates.main_image !== undefined)
      updateData.main_image = updates.main_image;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.is_published !== undefined)
      updateData.is_published = updates.is_published;

    const { data, error } = await this.supabase.supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update project: ${error.message}`);
    return this.mapProject(data);
  }

  /**
   * Soft delete project
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  }

  /**
   * Create project translation
   */
  async createTranslation(
    data: Omit<ProjectTranslation, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ProjectTranslation> {
    const { data: translation, error } = await this.supabase.supabase
      .from('project_translations')
      .insert({
        project_id: data.project_id,
        language: data.language,
        title: data.title,
        summary: data.summary,
        description: data.description,
        architecture: data.architecture,
        features: data.features,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create translation: ${error.message}`);
    return this.mapTranslation(translation);
  }

  /**
   * Find translations by project ID
   */
  async findTranslationsByProjectId(
    projectId: string,
  ): Promise<ProjectTranslation[]> {
    const { data, error } = await this.supabase.supabase
      .from('project_translations')
      .select('*')
      .eq('project_id', projectId);

    if (error)
      throw new Error(`Failed to fetch translations: ${error.message}`);
    return (data ?? []).map((t) => this.mapTranslation(t));
  }

  /**
   * Update project translation
   */
  async updateTranslation(
    projectId: string,
    language: 'en' | 'ar',
    updates: Partial<
      Omit<
        ProjectTranslation,
        'id' | 'project_id' | 'language' | 'created_at' | 'updated_at'
      >
    >,
  ): Promise<ProjectTranslation> {
    const { data, error } = await this.supabase.supabase
      .from('project_translations')
      .update(updates)
      .eq('project_id', projectId)
      .eq('language', language)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to update translation: ${error.message}`);
    return this.mapTranslation(data);
  }

  /**
   * Delete project translation
   */
  async deleteTranslation(
    projectId: string,
    language: 'en' | 'ar',
  ): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('project_translations')
      .delete()
      .eq('project_id', projectId)
      .eq('language', language);

    if (error)
      throw new Error(`Failed to delete translation: ${error.message}`);
  }

  /**
   * Create or update project rating
   */
  async upsertRating(
    data: Omit<ProjectRating, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ProjectRating> {
    const { data: rating, error } = await this.supabase.supabase
      .from('project_ratings')
      .upsert(
        {
          project_id: data.project_id,
          user_id: data.user_id,
          rating: data.rating,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,user_id',
        },
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert rating: ${error.message}`);
    return this.mapRating(rating);
  }

  /**
   * Find rating by project and user
   */
  async findRatingByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectRating | null> {
    const { data, error } = await this.supabase.supabase
      .from('project_ratings')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return this.mapRating(data);
  }

  /**
   * Delete project rating
   */
  async deleteRating(projectId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('project_ratings')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete rating: ${error.message}`);
  }

  /**
   * Toggle project like
   */
  async toggleLike(
    projectId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    // Check if like exists
    const { data: existingLike } = await this.supabase.supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await this.supabase.supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw new Error(`Failed to unlike project: ${error.message}`);
      return { liked: false };
    } else {
      // Like
      const { error } = await this.supabase.supabase
        .from('project_likes')
        .insert({
          project_id: projectId,
          user_id: userId,
        });

      if (error) throw new Error(`Failed to like project: ${error.message}`);
      return { liked: true };
    }
  }

  /**
   * Check if user liked project
   */
  async checkUserLiked(projectId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase.supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /**
   * Find project with relations (translations, user info, user interactions)
   */
  async findByIdWithRelations(
    id: string,
    userId?: string,
  ): Promise<ProjectWithRelations | null> {
    const project = await this.findById(id);
    if (!project) return null;

    // Get translations
    const translations = await this.findTranslationsByProjectId(id);

    // Get user info
    const { data: userData } = await this.supabase.supabase
      .from('users')
      .select('id, email, first_name, last_name, avatar_url')
      .eq('id', project.user_id)
      .single();

    // Get user interactions if userId provided
    let userLiked = false;
    let userRating: number | null = null;

    if (userId) {
      userLiked = await this.checkUserLiked(id, userId);
      const rating = await this.findRatingByProjectAndUser(id, userId);
      userRating = rating?.rating ?? null;
    }

    return {
      ...project,
      translations,
      user_liked: userLiked,
      user_rating: userRating,
      user: userData
        ? {
            id: userData.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            avatar_url: userData.avatar_url,
          }
        : undefined,
    };
  }

  /**
   * Map database row to Project type
   */
  private mapProject(row: any): Project {
    return {
      id: row.id,
      user_id: row.user_id,
      tech_stack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
      role: row.role,
      github_url: row.github_url,
      github_backend_url: row.github_backend_url,
      live_demo_url: row.live_demo_url,
      main_image: row.main_image,
      images: Array.isArray(row.images) ? row.images : [],
      average_rating: parseFloat(row.average_rating ?? 0),
      total_ratings: parseInt(row.total_ratings ?? 0, 10),
      total_likes: parseInt(row.total_likes ?? 0, 10),
      is_published: row.is_published ?? false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
    };
  }

  /**
   * Map database row to ProjectTranslation type
   */
  private mapTranslation(row: any): ProjectTranslation {
    return {
      id: row.id,
      project_id: row.project_id,
      language: row.language,
      title: row.title,
      summary: row.summary,
      description: row.description,
      architecture: row.architecture,
      features: Array.isArray(row.features) ? row.features : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Map database row to ProjectRating type
   */
  private mapRating(row: any): ProjectRating {
    return {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      rating: parseInt(row.rating, 10),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
