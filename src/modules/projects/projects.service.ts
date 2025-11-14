import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, IsNull } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectTranslation } from './entities/project-translation.entity';
import { ProjectRating } from './entities/project-rating.entity';
import { ProjectLike } from './entities/project-like.entity';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { RateProjectDto } from './dtos/rate-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { RequestUtil } from 'src/core/utils/request.util';
import { TranslationUtil } from 'src/core/utils/translations';
import type { Request } from 'express';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectTranslation)
    private readonly translationRepository: Repository<ProjectTranslation>,
    @InjectRepository(ProjectRating)
    private readonly ratingRepository: Repository<ProjectRating>,
    @InjectRepository(ProjectLike)
    private readonly likeRepository: Repository<ProjectLike>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
    req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);

    // Check if slug already exists (including soft-deleted projects)
    const existingProject = await this.projectRepository.findOne({
      where: { slug: createProjectDto.slug, deleted_at: IsNull() },
    });

    if (existingProject) {
      throw new BadRequestException(
        TranslationUtil.translate('projects.slug.exists', lang),
      );
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      user_id: userId,
    });

    try {
      const savedProject = await this.projectRepository.save(project);

      // Create translations if provided
      if (
        createProjectDto.translations &&
        createProjectDto.translations.length > 0
      ) {
        // Filter out translations with empty required fields
        const validTranslations = createProjectDto.translations.filter(
          (t) => t.title && t.summary && t.description,
        );

        if (validTranslations.length > 0) {
          // Use upsert logic to avoid duplicate key errors
          for (const translationDto of validTranslations) {
            let translation = await this.translationRepository.findOne({
              where: {
                project_id: savedProject.id,
                language: translationDto.language,
              },
            });

            if (translation) {
              // Update existing translation
              Object.assign(translation, translationDto);
              await this.translationRepository.save(translation);
            } else {
              // Create new translation
              translation = this.translationRepository.create({
                ...translationDto,
                project_id: savedProject.id,
              });
              await this.translationRepository.save(translation);
            }
          }
        }
      }

      return this.findOne(savedProject.id, req);
    } catch (error: any) {
      // Handle database constraint violations (e.g., duplicate slug)
      if (error.code === '23505' || error.code === '23503') {
        // PostgreSQL unique constraint violation
        if (
          error.constraint?.includes('slug') ||
          error.detail?.includes('slug')
        ) {
          throw new BadRequestException(
            TranslationUtil.translate('projects.slug.exists', lang),
          );
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  async findAll(queryDto: QueryProjectsDto, req: Request) {
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

    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .leftJoinAndSelect('project.translations', 'translations')
      .where('project.deleted_at IS NULL');

    if (is_published !== undefined) {
      queryBuilder.andWhere('project.is_published = :is_published', {
        is_published,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(translations.title ILIKE :search OR translations.summary ILIKE :search OR translations.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tech_stack) {
      queryBuilder.andWhere('project.tech_stack @> :tech_stack', {
        tech_stack: JSON.stringify([tech_stack]),
      });
    }

    // Get current language translation
    const currentLang = lang;
    queryBuilder.andWhere(
      '(translations.language = :lang OR translations.language IS NULL)',
      { lang: currentLang },
    );

    queryBuilder.orderBy(`project.${sort_by}`, order);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [projects, total] = await queryBuilder.getManyAndCount();

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

  async findOne(id: string, req: Request) {
    const lang = RequestUtil.getLanguage(req);

    const project = await this.projectRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['user', 'translations', 'ratings', 'likes'],
    });

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);

    const project = await this.projectRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    if (project.user_id !== userId) {
      throw new ForbiddenException(
        TranslationUtil.translate('projects.forbidden', lang),
      );
    }

    Object.assign(project, updateProjectDto);

    try {
      await this.projectRepository.save(project);

      // Update translations if provided
      if (
        updateProjectDto.translations &&
        updateProjectDto.translations.length > 0
      ) {
        for (const translationDto of updateProjectDto.translations) {
          let translation = await this.translationRepository.findOne({
            where: {
              project_id: id,
              language: translationDto.language,
            },
          });

          if (translation) {
            // Update existing translation
            Object.assign(translation, {
              title: translationDto.title,
              summary: translationDto.summary,
              description: translationDto.description,
              architecture: translationDto.architecture || null,
              features: translationDto.features || [],
            });
            await this.translationRepository.save(translation);
          } else {
            // Create new translation only if it doesn't exist
            translation = this.translationRepository.create({
              project: { id } as any,
              language: translationDto.language,
              title: translationDto.title,
              summary: translationDto.summary,
              description: translationDto.description,
              architecture: translationDto.architecture || null,
              features: translationDto.features || [],
            });
            await this.translationRepository.save(translation);
          }
        }
      }

      return this.findOne(id, req);
    } catch (error: any) {
      // Handle database constraint violations
      if (error.code === '23505' || error.code === '23503') {
        // Handle translation duplicate key errors
        if (
          error.constraint?.includes('project_translations') ||
          error.detail?.includes('project_translations') ||
          error.table === 'project_translations'
        ) {
          throw new BadRequestException(
            TranslationUtil.translate('projects.translation.exists', lang) ||
              'Translation already exists for this language',
          );
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  async remove(id: string, userId: string, req: Request) {
    const lang = RequestUtil.getLanguage(req);

    const project = await this.projectRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    if (project.user_id !== userId) {
      throw new ForbiddenException(
        TranslationUtil.translate('projects.forbidden', lang),
      );
    }

    await this.projectRepository.softDelete(id);
    return { message: TranslationUtil.translate('projects.deleted', lang) };
  }

  async rateProject(
    projectId: string,
    userId: string,
    rateDto: RateProjectDto,
    req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);

    const project = await this.projectRepository.findOne({
      where: { id: projectId, deleted_at: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    // Check if user already rated
    let rating = await this.ratingRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (rating) {
      rating.rating = rateDto.rating;
      await this.ratingRepository.save(rating);
    } else {
      rating = this.ratingRepository.create({
        project_id: projectId,
        user_id: userId,
        rating: rateDto.rating,
      });
      await this.ratingRepository.save(rating);
      project.total_ratings += 1;
    }

    // Recalculate average rating
    const ratings = await this.ratingRepository.find({
      where: { project_id: projectId },
    });
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    project.average_rating = sum / ratings.length;
    await this.projectRepository.save(project);

    return {
      message: TranslationUtil.translate('projects.rated', lang),
      rating: project.average_rating,
    };
  }

  async likeProject(projectId: string, userId: string, req: Request) {
    const lang = RequestUtil.getLanguage(req);

    const project = await this.projectRepository.findOne({
      where: { id: projectId, deleted_at: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        TranslationUtil.translate('projects.notFound', lang),
      );
    }

    // Check if user already liked
    const existingLike = await this.likeRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (existingLike) {
      // Unlike
      await this.likeRepository.remove(existingLike);
      project.total_likes -= 1;
      await this.projectRepository.save(project);
      return {
        message: TranslationUtil.translate('projects.unliked', lang),
        liked: false,
      };
    } else {
      // Like
      const like = this.likeRepository.create({
        project_id: projectId,
        user_id: userId,
      });
      await this.likeRepository.save(like);
      project.total_likes += 1;
      await this.projectRepository.save(project);
      return {
        message: TranslationUtil.translate('projects.liked', lang),
        liked: true,
      };
    }
  }

  async checkUserLike(projectId: string, userId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });
    return !!like;
  }

  async checkUserRating(projectId: string, userId: string) {
    const rating = await this.ratingRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });
    return rating ? rating.rating : null;
  }
}
