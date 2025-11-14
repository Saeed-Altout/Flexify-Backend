import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { RateProjectDto } from './dtos/rate-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseUtil } from 'src/core/utils/response';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const project = await this.projectsService.create(
      createProjectDto,
      user.id,
      req,
    );

    return ResponseUtil.success(
      project,
      TranslationUtil.translate('projects.created', lang),
      lang,
    );
  }

  @Get()
  async findAll(@Query() queryDto: QueryProjectsDto, @Req() req: Request) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.projectsService.findAll(queryDto, req);

    return ResponseUtil.success(
      {
        data: result.data,
        meta: result.meta,
      },
      TranslationUtil.translate('projects.list', lang),
      lang,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const lang = RequestUtil.getLanguage(req);
    const project = await this.projectsService.findOne(id, req);

    // Check if user is authenticated and get their like/rating status
    let userLike = false;
    let userRating: number | null = null;

    const user = (req as any).user;
    if (user?.id) {
      userLike = await this.projectsService.checkUserLike(id, user.id);
      userRating = await this.projectsService.checkUserRating(id, user.id);
    }

    return ResponseUtil.success(
      {
        ...project,
        user_liked: userLike,
        user_rating: userRating,
      },
      TranslationUtil.translate('projects.found', lang),
      lang,
    );
  }

  @Patch(':id')
  @UseGuards(SessionGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const project = await this.projectsService.update(
      id,
      updateProjectDto,
      user.id,
      req,
    );

    return ResponseUtil.success(
      project,
      TranslationUtil.translate('projects.updated', lang),
      lang,
    );
  }

  @Delete(':id')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.projectsService.remove(id, user.id, req);

    return ResponseUtil.success(null, result.message, lang);
  }

  @Post(':id/rate')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async rateProject(
    @Param('id') id: string,
    @Body() rateDto: RateProjectDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.projectsService.rateProject(
      id,
      user.id,
      rateDto,
      req,
    );

    return ResponseUtil.success(
      { rating: result.rating },
      result.message,
      lang,
    );
  }

  @Post(':id/like')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async likeProject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.projectsService.likeProject(id, user.id, req);

    return ResponseUtil.success(
      { liked: result.liked },
      result.message,
      lang,
    );
  }
}

