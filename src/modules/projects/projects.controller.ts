import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UploadProjectImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    const project = await this.projectsService.create(createProjectDto, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(project, 'projects.create.success', lang);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryProjectDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    const result = await this.projectsService.findAll(queryDto, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successList(
      result.projects,
      result.total,
      result.page,
      result.limit,
      'projects.findAll.success',
      lang,
    );
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string, @Request() req: any): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    const result = await this.projectsService.findBySlug(slug, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(result, 'projects.findBySlug.success', lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    const project = await this.projectsService.findOne(id, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(project, 'projects.findOne.success', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const project = await this.projectsService.update(id, updateProjectDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(project, 'projects.update.success', lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.projectsService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'projects.delete.success', lang);
  }

  // ========================================
  // PROJECT THUMBNAIL
  // ========================================

  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const thumbnailUrl = await this.projectsService.uploadThumbnail(id, file);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ thumbnailUrl }, 'projects.thumbnail.upload.success', lang);
  }

  // ========================================
  // PROJECT IMAGES
  // ========================================

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadProjectImageDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const imageUrl = await this.projectsService.uploadImage(
      id,
      file,
      uploadDto.altText,
      uploadDto.orderIndex,
      uploadDto.isPrimary,
    );

    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ imageUrl }, 'projects.image.upload.success', lang);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Param('imageId') imageId: string,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.projectsService.deleteImage(imageId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'projects.image.delete.success', lang);
  }

  // ========================================
  // PROJECT INTERACTIONS (Like/Share)
  // ========================================

  @Post('interactions')
  @UseGuards(JwtAuthGuard)
  async toggleInteraction(
    @Body() createInteractionDto: CreateInteractionDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    const result = await this.projectsService.toggleInteraction(createInteractionDto, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(result, 'projects.interaction.success', lang);
  }

  // ========================================
  // PROJECT VIEWS
  // ========================================

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async incrementView(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.projectsService.incrementView(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'projects.view.incremented', lang, false);
  }

  // ========================================
  // PROJECT COMMENTS
  // ========================================

  @Get(':id/comments')
  async getComments(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const comments = await this.projectsService.getComments(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ data: { comments } }, 'projects.comments.success', lang);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    const comment = await this.projectsService.createComment(createCommentDto, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(comment, 'projects.comments.create.success', lang);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    await this.projectsService.deleteComment(commentId, userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'projects.comments.delete.success', lang);
  }
}

