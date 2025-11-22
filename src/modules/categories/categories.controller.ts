import { Controller, Get, Param, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Request() req: any): Promise<StandardResponse<any>> {
    const categories = await this.categoriesService.findAll();
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ categories }, 'categories.findAll.success', lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const category = await this.categoriesService.findOne(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(category, 'categories.findOne.success', lang);
  }
}

