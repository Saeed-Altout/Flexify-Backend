import { Project } from '../entities/project.entity';
import { ProjectTranslation } from '../entities/project-translation.entity';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { UpdateProjectDto } from '../dtos/update-project.dto';

/**
 * Mapper for converting between DTOs and Entities
 * Follows DDD principles for data transformation
 */
export class ProjectMapper {
  /**
   * Map CreateProjectDto to Project entity
   */
  static toEntity(dto: CreateProjectDto, userId: string): Partial<Project> {
    return {
      user_id: userId,
      tech_stack: dto.tech_stack,
      role: dto.role,
      github_url: dto.github_url,
      github_backend_url: dto.github_backend_url,
      live_demo_url: dto.live_demo_url,
      main_image: dto.main_image,
      images: dto.images || [],
      is_published: dto.is_published ?? false,
    };
  }

  /**
   * Map UpdateProjectDto to partial Project entity
   */
  static toUpdateEntity(dto: UpdateProjectDto): Partial<Project> {
    const entity: Partial<Project> = {};

    if (dto.tech_stack !== undefined) entity.tech_stack = dto.tech_stack;
    if (dto.role !== undefined) entity.role = dto.role;
    if (dto.github_url !== undefined) entity.github_url = dto.github_url;
    if (dto.github_backend_url !== undefined)
      entity.github_backend_url = dto.github_backend_url;
    if (dto.live_demo_url !== undefined)
      entity.live_demo_url = dto.live_demo_url;
    if (dto.main_image !== undefined) entity.main_image = dto.main_image;
    if (dto.images !== undefined) entity.images = dto.images;
    if (dto.is_published !== undefined) entity.is_published = dto.is_published;

    return entity;
  }

  /**
   * Map Project entity to DTO (for responses)
   */
  static toDto(project: Project, language?: string): any {
    const translation = language
      ? project.translations?.find((t) => t.language === language)
      : project.translations?.[0];

    return {
      id: project.id,
      user_id: project.user_id,
      tech_stack: project.tech_stack,
      role: project.role,
      github_url: project.github_url,
      github_backend_url: project.github_backend_url,
      live_demo_url: project.live_demo_url,
      main_image: project.main_image,
      images: project.images,
      average_rating: project.average_rating,
      total_ratings: project.total_ratings,
      total_likes: project.total_likes,
      is_published: project.is_published,
      title: translation?.title,
      summary: translation?.summary,
      description: translation?.description,
      architecture: translation?.architecture || undefined,
      features: translation?.features || [],
      translations: project.translations,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  /**
   * Map translation DTO to entity
   */
  static translationToEntity(
    dto: CreateProjectDto['translations'][0],
    projectId: string,
  ): Partial<ProjectTranslation> {
    const entity: Partial<ProjectTranslation> = {
      project: { id: projectId } as any,
      language: dto.language,
      title: dto.title,
      summary: dto.summary,
      description: dto.description,
      features: dto.features ?? [],
    };

    // Handle architecture separately to match entity type (string | null)
    // TypeScript's Partial makes it string | undefined, but entity expects string | null
    if (dto.architecture !== undefined) {
      (entity as any).architecture = dto.architecture || null;
    }

    return entity;
  }

  /**
   * Map translation update DTO to entity
   */
  static translationToUpdateEntity(
    dto:
      | {
          language: string;
          title?: string;
          summary?: string;
          description?: string;
          architecture?: string;
          features?: string[];
        }
      | undefined,
  ): Partial<ProjectTranslation> {
    if (!dto) {
      return {};
    }

    const entity: Partial<ProjectTranslation> = {};

    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.summary !== undefined) entity.summary = dto.summary;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.architecture !== undefined)
      entity.architecture = dto.architecture ?? null;
    if (dto.features !== undefined) entity.features = dto.features || [];

    return entity;
  }
}
