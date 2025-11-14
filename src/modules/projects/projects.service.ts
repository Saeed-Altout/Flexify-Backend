import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectMapper } from './mappers/project.mapper';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { RateProjectDto } from './dtos/rate-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { RequestUtil } from 'src/core/utils/request.util';
import { TranslationUtil } from 'src/core/utils/translations';
import { Project } from './entities/project.entity';
import { ProjectRating } from './entities/project-rating.entity';
import { ProjectLike } from './entities/project-like.entity';

/**
 * Projects Service
 * Contains business logic only, delegates data access to repository
 * Follows DDD principles with clean separation of concerns
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly projectsRepository: ProjectsRepository) {}

  /**
   * Create a new project
   */
  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
    req: Request,
  ): Promise<Project> {
    const lang = RequestUtil.getLanguage(req);
    this.logger.log(`Creating project for user ${userId}`);

    try {
      // Map DTO to entity
      const projectData = ProjectMapper.toEntity(createProjectDto, userId);
      const project = await this.projectsRepository.create(projectData);

      // Create translations
      if (createProjectDto.translations?.length) {
        const validTranslations = createProjectDto.translations.filter(
          (t) => t.title && t.summary && t.description,
        );

        for (const translationDto of validTranslations) {
          const existingTranslation =
            await this.projectsRepository.findTranslation(
              project.id,
              translationDto.language,
            );

          const translationData = ProjectMapper.translationToEntity(
            translationDto,
            project.id,
          );

          if (existingTranslation) {
            await this.projectsRepository.updateTranslation(
              existingTranslation.id,
              translationData,
            );
          } else {
            await this.projectsRepository.createTranslation(translationData);
          }
        }
      }

      return this.findOne(project.id, req);
    } catch (error: any) {
      this.logger.error(
        `Error creating project: ${error.message}`,
        error.stack,
      );

      // Handle database constraint violations
      if (error.code === '23505' || error.code === '23503') {
        if (
          error.constraint?.includes('project_translations') ||
          error.detail?.includes('project_translations')
        ) {
          throw new BadRequestException(
            TranslationUtil.translate('projects.translation.exists', lang),
          );
        }
      }

      throw error;
    }
  }

  /**
   * Find all projects with pagination and filters
   */
  async findAll(
    queryDto: QueryProjectsDto,
    req: Request,
  ): Promise<{
    data: Project[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const lang = RequestUtil.getLanguage(req);
    const {
      search,
      tech_stack,
      is_published,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      order = 'DESC',
    } = queryDto;

    const [projects, total] = await this.projectsRepository.findAll({
      search,
      techStack: tech_stack,
      isPublished: is_published,
      page,
      limit,
      sortBy: sort_by,
      order: order as 'ASC' | 'DESC',
      language: lang,
    });

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find project by ID
   */
  async findOne(id: string, req: Request): Promise<Project> {
    const lang = RequestUtil.getLanguage(req);
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    return project;
  }

  /**
   * Update project
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    req: Request,
  ): Promise<Project> {
    const lang = RequestUtil.getLanguage(req);
    this.logger.log(`Updating project ${id} for user ${userId}`);

    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    // Check ownership
    const isOwner = await this.projectsRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new ForbiddenException(
        TranslationUtil.translate('projects.forbidden', lang),
      );
    }

    try {
      // Update main project fields
      const updateData = ProjectMapper.toUpdateEntity(updateProjectDto);
      if (Object.keys(updateData).length > 0) {
        await this.projectsRepository.update(id, updateData);
      }

      // Update translations
      if (updateProjectDto.translations?.length) {
        for (const translationDto of updateProjectDto.translations) {
          const existingTranslation =
            await this.projectsRepository.findTranslation(
              id,
              translationDto.language,
            );

          const translationData =
            ProjectMapper.translationToUpdateEntity(translationDto);

          if (existingTranslation) {
            await this.projectsRepository.updateTranslation(
              existingTranslation.id,
              translationData,
            );
          } else {
            // For new translations, ensure all required fields are present
            if (
              translationDto.title &&
              translationDto.summary &&
              translationDto.description
            ) {
              const newTranslationData = ProjectMapper.translationToEntity(
                {
                  language: translationDto.language,
                  title: translationDto.title,
                  summary: translationDto.summary,
                  description: translationDto.description,
                  architecture: translationDto.architecture,
                  features: translationDto.features,
                },
                id,
              );
              await this.projectsRepository.createTranslation(
                newTranslationData,
              );
            }
          }
        }
      }

      return this.findOne(id, req);
    } catch (error: any) {
      this.logger.error(
        `Error updating project: ${error.message}`,
        error.stack,
      );

      if (error.code === '23505' || error.code === '23503') {
        if (
          error.constraint?.includes('project_translations') ||
          error.detail?.includes('project_translations')
        ) {
          throw new BadRequestException(
            TranslationUtil.translate('projects.translation.exists', lang),
          );
        }
      }

      throw error;
    }
  }

  /**
   * Delete project (soft delete)
   */
  async remove(
    id: string,
    userId: string,
    req: Request,
  ): Promise<{
    message: string;
  }> {
    const lang = RequestUtil.getLanguage(req);
    this.logger.log(`Deleting project ${id} for user ${userId}`);

    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    const isOwner = await this.projectsRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new ForbiddenException(
        TranslationUtil.translate('projects.forbidden', lang),
      );
    }

    await this.projectsRepository.softDelete(id);

    return {
      message: TranslationUtil.translate('projects.deleted', lang),
    };
  }

  /**
   * Rate a project
   */
  async rateProject(
    id: string,
    userId: string,
    rateDto: RateProjectDto,
    req: Request,
  ): Promise<{ rating: ProjectRating; message: string }> {
    const lang = RequestUtil.getLanguage(req);
    this.logger.log(`Rating project ${id} by user ${userId}`);

    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    // Check if user already rated
    const existingRating = await this.projectsRepository.findUserRating(
      id,
      userId,
    );

    let rating: ProjectRating;

    if (existingRating) {
      // Update existing rating
      rating = await this.projectsRepository.updateRating(existingRating.id, {
        rating: rateDto.rating,
      });
    } else {
      // Create new rating
      rating = await this.projectsRepository.createRating({
        project: { id } as any,
        user_id: userId,
        rating: rateDto.rating,
      });
    }

    // Recalculate average rating
    const { average, total } =
      await this.projectsRepository.calculateAverageRating(id);
    await this.projectsRepository.update(id, {
      average_rating: average,
      total_ratings: total,
    });

    return {
      rating,
      message: TranslationUtil.translate('projects.rated', lang),
    };
  }

  /**
   * Like/Unlike a project
   */
  async likeProject(
    id: string,
    userId: string,
    req: Request,
  ): Promise<{ liked: boolean; message: string }> {
    const lang = RequestUtil.getLanguage(req);
    this.logger.log(`Toggling like for project ${id} by user ${userId}`);

    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    const existingLike = await this.projectsRepository.findUserLike(id, userId);

    if (existingLike) {
      // Unlike
      await this.projectsRepository.deleteLike(id, userId);
      const totalLikes = await this.projectsRepository.countLikes(id);
      await this.projectsRepository.update(id, { total_likes: totalLikes });

      return {
        liked: false,
        message: TranslationUtil.translate('projects.unliked', lang),
      };
    } else {
      // Like
      await this.projectsRepository.createLike({
        project: { id } as any,
        user_id: userId,
      });
      const totalLikes = await this.projectsRepository.countLikes(id);
      await this.projectsRepository.update(id, { total_likes: totalLikes });

      return {
        liked: true,
        message: TranslationUtil.translate('projects.liked', lang),
      };
    }
  }

  /**
   * Check if user liked project
   */
  async checkUserLike(projectId: string, userId: string): Promise<boolean> {
    const like = await this.projectsRepository.findUserLike(projectId, userId);
    return !!like;
  }

  /**
   * Check user rating for project
   */
  async checkUserRating(
    projectId: string,
    userId: string,
  ): Promise<number | null> {
    const rating = await this.projectsRepository.findUserRating(
      projectId,
      userId,
    );
    return rating?.rating || null;
  }
}
