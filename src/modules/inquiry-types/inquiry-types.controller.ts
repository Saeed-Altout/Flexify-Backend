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
} from '@nestjs/common';
import { InquiryTypesService } from './inquiry-types.service';
import { CreateInquiryTypeDto } from './dto/create-inquiry-type.dto';
import { UpdateInquiryTypeDto } from './dto/update-inquiry-type.dto';
import { QueryInquiryTypeDto } from './dto/query-inquiry-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('inquiry-types')
export class InquiryTypesController {
  constructor(private readonly inquiryTypesService: InquiryTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateInquiryTypeDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const inquiryType = await this.inquiryTypesService.create(createDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(inquiryType, 'inquiryTypes.create.success', lang);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryInquiryTypeDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.inquiryTypesService.findAll(queryDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successList(
      result.inquiryTypes,
      result.total,
      result.page,
      result.limit,
      'inquiryTypes.findAll.success',
      lang,
    );
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string, @Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const inquiryType = await this.inquiryTypesService.findBySlug(slug, lang);
    return ResponseUtil.successSingle(inquiryType, 'inquiryTypes.findBySlug.success', lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const inquiryType = await this.inquiryTypesService.findOne(id, lang);
    return ResponseUtil.successSingle(inquiryType, 'inquiryTypes.findOne.success', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInquiryTypeDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const inquiryType = await this.inquiryTypesService.update(id, updateDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(inquiryType, 'inquiryTypes.update.success', lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.inquiryTypesService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'inquiryTypes.delete.success', lang);
  }
}

