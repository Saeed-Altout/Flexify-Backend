import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Get()
  async findAll(@Request() req: any): Promise<StandardResponse<any>> {
    const technologies = await this.technologiesService.findAll();
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ technologies }, 'technologies.findAll.success', lang);
  }

  @Get('category/:category')
  async findByCategory(
    @Param('category') category: string,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const technologies = await this.technologiesService.findByCategory(category);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ technologies }, 'technologies.findByCategory.success', lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const technology = await this.technologiesService.findOne(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(technology, 'technologies.findOne.success', lang);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateTechnologyDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const technology = await this.technologiesService.create(createDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(technology, 'technologies.create.success', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTechnologyDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const technology = await this.technologiesService.update(id, updateDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(technology, 'technologies.update.success', lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.technologiesService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'technologies.delete.success', lang);
  }
}

