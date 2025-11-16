import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsRepository } from './repositories/projects.repository';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { RateProjectDto } from './dtos/rate-project.dto';
import { Project } from './types/project.type';
import { ProjectWithRelations } from './types/project-with-relations.type';
import { TranslationUtil } from '../../core/utils/translations';
import { RequestUtil } from '../../core/utils/request.util';
import type { Request } from 'express';

/**
 * Projects Service
 * Single Responsibility: Business logic for projects
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  /**
   * Create a new project
   */
  async create(
    userId: string,
    createProjectDto: CreateProjectDto,
    req: Request,
  ): Promise<ProjectWithRelations> {
    const lang = RequestUtil.getLanguage(req);

    // Validate that translations include both languages
    const languages = createProjectDto.translations.map((t) => t.language);
    if (!languages.includes('en') || !languages.includes('ar')) {
      throw new BadRequestException(
        TranslationUtil.translate('projects.create.missingTranslations', lang),
      );
    }

    // Create project
    const project = await this.projectsRepository.create({
      user_id: userId,
      tech_stack: createProjectDto.tech_stack,
      role: createProjectDto.role,
      github_url: createProjectDto.github_url ?? null,
      github_backend_url: createProjectDto.github_backend_url ?? null,
      live_demo_url: createProjectDto.live_demo_url ?? null,
      main_image: createProjectDto.main_image ?? null,
      images: createProjectDto.images ?? [],
      average_rating: 0,
      total_ratings: 0,
      total_likes: 0,
      is_published: createProjectDto.is_published ?? false,
      deleted_at: null,
    });

    // Create translations
    for (const translation of createProjectDto.translations) {
      await this.projectsRepository.createTranslation({
        project_id: project.id,
        language: translation.language,
        title: translation.title,
        summary: translation.summary,
        description: translation.description,
        architecture: translation.architecture ?? null,
        features: translation.features ?? [],
      });
    }

    // Return project with relations
    const projectWithRelations =
      await this.projectsRepository.findByIdWithRelations(project.id, userId);

    if (!projectWithRelations) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    return projectWithRelations;
  }

  /**
   * Find all projects with filters
   */
  async findAll(
    queryDto: QueryProjectsDto,
    userId?: string,
  ): Promise<{
    data: ProjectWithRelations[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 10;

    const result = await this.projectsRepository.findMany({
      user_id: queryDto.is_published === false ? undefined : undefined, // Only filter by user if not published
      is_published: queryDto.is_published,
      search: queryDto.search,
      tech_stack: queryDto.tech_stack,
      page,
      limit,
      sort_by: queryDto.sort_by,
      order: queryDto.order,
    });

    // Fetch relations for each project
    const projectsWithRelations = await Promise.all(
      result.data.map(async (project) => {
        return await this.projectsRepository.findByIdWithRelations(
          project.id,
          userId,
        );
      }),
    );

    const totalPages = Math.ceil(result.total / limit);

    return {
      data: projectsWithRelations.filter(
        (p): p is ProjectWithRelations => p !== null,
      ),
      meta: {
        total: result.total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find project by ID
   */
  async findOne(id: string, userId?: string): Promise<ProjectWithRelations> {
    const project = await this.projectsRepository.findByIdWithRelations(
      id,
      userId,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Update project
   */
  async update(
    id: string,
    userId: string,
    updateProjectDto: UpdateProjectDto,
    req: Request,
  ): Promise<ProjectWithRelations> {
    const lang = RequestUtil.getLanguage(req);

    // Check if project exists and user owns it
    const existingProject = await this.projectsRepository.findById(id);
    if (!existingProject) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    if (existingProject.user_id !== userId) {
      throw new ForbiddenException(
        TranslationUtil.translate('projects.update.forbidden', lang),
      );
    }

    // Update project if fields provided
    if (
      updateProjectDto.tech_stack ||
      updateProjectDto.role ||
      updateProjectDto.github_url !== undefined ||
      updateProjectDto.github_backend_url !== undefined ||
      updateProjectDto.live_demo_url !== undefined ||
      updateProjectDto.main_image !== undefined ||
      updateProjectDto.images !== undefined ||
      updateProjectDto.is_published !== undefined
    ) {
      await this.projectsRepository.update(id, {
        tech_stack: updateProjectDto.tech_stack,
        role: updateProjectDto.role,
        github_url: updateProjectDto.github_url,
        github_backend_url: updateProjectDto.github_backend_url,
        live_demo_url: updateProjectDto.live_demo_url,
        main_image: updateProjectDto.main_image,
        images: updateProjectDto.images,
        is_published: updateProjectDto.is_published,
      } as Partial<Project>);
    }

    // Update translations if provided
    if (updateProjectDto.translations) {
      for (const translation of updateProjectDto.translations) {
        await this.projectsRepository.updateTranslation(
          id,
          translation.language,
          {
            title: translation.title,
            summary: translation.summary,
            description: translation.description,
            architecture: translation.architecture,
            features: translation.features,
          },
        );
      }
    }

    // Return updated project with relations
    const updatedProject = await this.projectsRepository.findByIdWithRelations(
      id,
      userId,
    );

    if (!updatedProject) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    return updatedProject;
  }

  /**
   * Delete project (soft delete)
   */
  async remove(id: string, userId: string, req: Request): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    // Check if project exists and user owns it
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    if (project.user_id !== userId) {
      throw new ForbiddenException(
        TranslationUtil.translate('projects.delete.forbidden', lang),
      );
    }

    await this.projectsRepository.delete(id);
  }

  /**
   * Rate a project
   */
  async rate(
    id: string,
    userId: string,
    rateProjectDto: RateProjectDto,
    req: Request,
  ): Promise<{ rating: number }> {
    const lang = RequestUtil.getLanguage(req);

    // Check if project exists
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    // Upsert rating
    await this.projectsRepository.upsertRating({
      project_id: id,
      user_id: userId,
      rating: rateProjectDto.rating,
    });

    // Get updated project to return current average rating
    const updatedProject = await this.projectsRepository.findById(id);
    if (!updatedProject) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    return { rating: updatedProject.average_rating };
  }

  /**
   * Like/Unlike a project
   */
  async toggleLike(
    id: string,
    userId: string,
    req: Request,
  ): Promise<{ liked: boolean }> {
    const lang = RequestUtil.getLanguage(req);

    // Check if project exists
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    // Toggle like
    const result = await this.projectsRepository.toggleLike(id, userId);
    return result;
  }
}
