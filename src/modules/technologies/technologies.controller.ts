import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
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
}

