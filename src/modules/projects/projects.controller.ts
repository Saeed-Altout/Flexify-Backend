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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { QueryProjectsDto } from './dtos/query-projects.dto';
import { RateProjectDto } from './dtos/rate-project.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/types/user.type';
import { ResponseUtil } from '../../core/utils/response';
import { TranslationUtil } from '../../core/utils/translations';
import { RequestUtil } from '../../core/utils/request.util';
import type { Request } from 'express';

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
    const project = await this.projectsService.create(user.id, createProjectDto, req);

    return ResponseUtil.success(
      project,
      TranslationUtil.translate('projects.create.success', lang),
      lang,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() queryDto: QueryProjectsDto,
    @CurrentUser() user?: User,
    @Req() req?: Request,
  ) {
    const lang = req ? RequestUtil.getLanguage(req) : 'en';
    const result = await this.projectsService.findAll(queryDto, user?.id);

    return ResponseUtil.success(
      result,
      TranslationUtil.translate('projects.findAll.success', lang),
      lang,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: User,
    @Req() req?: Request,
  ) {
    const lang = req ? RequestUtil.getLanguage(req) : 'en';
    const project = await this.projectsService.findOne(id, user?.id);

    return ResponseUtil.success(
      project,
      TranslationUtil.translate('projects.findOne.success', lang),
      lang,
    );
  }

  @Patch(':id')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const project = await this.projectsService.update(id, user.id, updateProjectDto, req);

    return ResponseUtil.success(
      project,
      TranslationUtil.translate('projects.update.success', lang),
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
    await this.projectsService.remove(id, user.id, req);

    return ResponseUtil.success(
      null,
      TranslationUtil.translate('projects.delete.success', lang),
      lang,
    );
  }

  @Post(':id/rate')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async rate(
    @Param('id') id: string,
    @Body() rateProjectDto: RateProjectDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.projectsService.rate(id, user.id, rateProjectDto, req);

    return ResponseUtil.success(
      result,
      TranslationUtil.translate('projects.rate.success', lang),
      lang,
    );
  }

  @Post(':id/like')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.projectsService.toggleLike(id, user.id, req);

    return ResponseUtil.success(
      result,
      TranslationUtil.translate('projects.like.success', lang),
      lang,
    );
  }
}

