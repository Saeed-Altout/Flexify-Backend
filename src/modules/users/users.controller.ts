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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const user = await this.usersService.create(createUserDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(user, 'User created successfully', lang);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryUserDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.usersService.findAll(queryDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successList(
      result.users,
      result.total,
      result.page,
      result.limit,
      'Users retrieved successfully',
      lang,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const user = await this.usersService.findOne(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(user, 'User retrieved successfully', lang);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // Use memory storage
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
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    if (!file) {
      throw new Error('No file uploaded');
    }
    const avatarUrl = await this.usersService.uploadAvatar(userId, file);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle({ avatarUrl }, 'Avatar uploaded successfully', lang);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const user = await this.usersService.update(userId, updateUserDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(user, 'Profile updated successfully', lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const user = await this.usersService.update(id, updateUserDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(user, 'User updated successfully', lang);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.usersService.remove(id);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'User deleted successfully', lang);
  }
}

