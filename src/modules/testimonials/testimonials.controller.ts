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
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { QueryTestimonialDto } from './dto/query-testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateTestimonialDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const testimonial = await this.testimonialsService.create(createDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(testimonial, 'testimonials.create.success', lang);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryTestimonialDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.testimonialsService.findAll(queryDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successList(
      result.testimonials,
      result.total,
      result.page,
      result.limit,
      'testimonials.findAll.success',
      lang,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    const lang = RequestUtil.getLanguage(req);
    const testimonial = await this.testimonialsService.findOne(id, lang);
    return ResponseUtil.successSingle(testimonial, 'testimonials.findOne.success', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTestimonialDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const testimonial = await this.testimonialsService.update(id, updateDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(testimonial, 'testimonials.update.success', lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: any): Promise<StandardResponse<any>> {
    await this.testimonialsService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'testimonials.delete.success', lang);
  }

  // ========================================
  // TESTIMONIAL AVATAR UPLOAD
  // ========================================

  @Post(':id/avatar')
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
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const avatarUrl = await this.testimonialsService.uploadAvatar(id, file);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ avatarUrl }, 'testimonials.avatar.upload.success', lang);
  }
}

