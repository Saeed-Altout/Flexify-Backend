import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectTranslation } from '../entities/project-translation.entity';
import { ProjectRating } from '../entities/project-rating.entity';
import { ProjectLike } from '../entities/project-like.entity';

/**
 * Repository layer for Project entity
 * Handles all database operations following DDD principles
 */
@Injectable()
export class ProjectsRepository {
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

  /**
   * Create a new project
   */
  async create(project: Partial<Project>): Promise<Project> {
    const newProject = this.projectRepository.create(project);
    return this.projectRepository.save(newProject);
  }

  /**
   * Find project by ID with relations
   */
  async findById(id: string, includeDeleted = false): Promise<Project | null> {
    const where: any = { id };
    if (!includeDeleted) {
      where.deleted_at = IsNull();
    }

    return this.projectRepository.findOne({
      where,
      relations: ['user', 'translations', 'ratings', 'likes'],
    });
  }

  /**
   * Find all projects with pagination and filters
   */
  async findAll(
    options: {
      search?: string;
      techStack?: string;
      isPublished?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      order?: 'ASC' | 'DESC';
      language?: string;
    },
  ): Promise<[Project[], number]> {
    const {
      search,
      techStack,
      isPublished,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      order = 'DESC',
      language,
    } = options;

    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .leftJoinAndSelect('project.translations', 'translations')
      .where('project.deleted_at IS NULL');

    if (isPublished !== undefined) {
      queryBuilder.andWhere('project.is_published = :isPublished', {
        isPublished,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(translations.title ILIKE :search OR translations.summary ILIKE :search OR translations.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (techStack) {
      queryBuilder.andWhere('project.tech_stack @> :techStack', {
        techStack: JSON.stringify([techStack]),
      });
    }

    if (language) {
      queryBuilder.andWhere(
        '(translations.language = :lang OR translations.language IS NULL)',
        { lang: language },
      );
    }

    queryBuilder.orderBy(`project.${sortBy}`, order);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    return queryBuilder.getManyAndCount();
  }

  /**
   * Update project
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    await this.projectRepository.update(id, updates);
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`Project with ID ${id} not found after update`);
    }
    return updated;
  }

  /**
   * Soft delete project
   */
  async softDelete(id: string): Promise<void> {
    await this.projectRepository.softDelete(id);
  }

  /**
   * Hard delete project
   */
  async hardDelete(id: string): Promise<void> {
    await this.projectRepository.delete(id);
  }

  /**
   * Check if user owns project
   */
  async isOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, user_id: userId, deleted_at: IsNull() },
    });
    return !!project;
  }

  /**
   * Translation repository methods
   */
  async findTranslation(
    projectId: string,
    language: string,
  ): Promise<ProjectTranslation | null> {
    return this.translationRepository.findOne({
      where: { project_id: projectId, language },
    });
  }

  async createTranslation(
    translation: Partial<ProjectTranslation>,
  ): Promise<ProjectTranslation> {
    const newTranslation = this.translationRepository.create(translation);
    return this.translationRepository.save(newTranslation);
  }

  async updateTranslation(
    id: string,
    updates: Partial<ProjectTranslation>,
  ): Promise<ProjectTranslation> {
    await this.translationRepository.update(id, updates);
    const updated = await this.translationRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(
        `Translation with ID ${id} not found after update`,
      );
    }
    return updated;
  }

  /**
   * Rating repository methods
   */
  async findUserRating(
    projectId: string,
    userId: string,
  ): Promise<ProjectRating | null> {
    return this.ratingRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });
  }

  async createRating(rating: Partial<ProjectRating>): Promise<ProjectRating> {
    const newRating = this.ratingRepository.create(rating);
    return this.ratingRepository.save(newRating);
  }

  async updateRating(
    id: string,
    updates: Partial<ProjectRating>,
  ): Promise<ProjectRating> {
    await this.ratingRepository.update(id, updates);
    const updated = await this.ratingRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(`Rating with ID ${id} not found after update`);
    }
    return updated;
  }

  async calculateAverageRating(projectId: string): Promise<{
    average: number;
    total: number;
  }> {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'average')
      .addSelect('COUNT(rating.id)', 'total')
      .where('rating.project_id = :projectId', { projectId })
      .getRawOne();

    return {
      average: parseFloat(result?.average || '0'),
      total: parseInt(result?.total || '0', 10),
    };
  }

  /**
   * Like repository methods
   */
  async findUserLike(
    projectId: string,
    userId: string,
  ): Promise<ProjectLike | null> {
    return this.likeRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });
  }

  async createLike(like: Partial<ProjectLike>): Promise<ProjectLike> {
    const newLike = this.likeRepository.create(like);
    return this.likeRepository.save(newLike);
  }

  async deleteLike(projectId: string, userId: string): Promise<void> {
    await this.likeRepository.delete({
      project_id: projectId,
      user_id: userId,
    });
  }

  async countLikes(projectId: string): Promise<number> {
    return this.likeRepository.count({
      where: { project_id: projectId },
    });
  }
}

