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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateServiceDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const service = await this.servicesService.create(createDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(service, 'services.create.success', lang);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryServiceDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.servicesService.findAll(queryDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successList(
      result.services,
      result.total,
      result.page,
      result.limit,
      'services.findAll.success',
      lang,
    );
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string, @Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const service = await this.servicesService.findBySlug(slug, lang);
    return ResponseUtil.successSingle(service, 'services.findBySlug.success', lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const service = await this.servicesService.findOne(id, lang);
    return ResponseUtil.successSingle(service, 'services.findOne.success', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const service = await this.servicesService.update(id, updateDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(service, 'services.update.success', lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.servicesService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'services.delete.success', lang);
  }

  // ========================================
  // SERVICE IMAGE
  // ========================================

  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // Use memory storage for buffer
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
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imageUrl = await this.servicesService.uploadImage(id, file);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ imageUrl }, 'services.image.upload.success', lang);
  }
}

