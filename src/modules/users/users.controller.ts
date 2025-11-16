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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<StandardResponse<any>> {
    const user = await this.usersService.create(createUserDto);
    return ResponseUtil.success(user, 'User created successfully');
  }

  @Get()
  async findAll(@Query() queryDto: QueryUserDto): Promise<StandardResponse<any>> {
    const result = await this.usersService.findAll(queryDto);
    return ResponseUtil.success(result, 'Users retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StandardResponse<any>> {
    const user = await this.usersService.findOne(id);
    return ResponseUtil.success(user, 'User retrieved successfully');
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
    return ResponseUtil.success({ avatarUrl }, 'Avatar uploaded successfully');
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const user = await this.usersService.update(userId, updateUserDto);
    return ResponseUtil.success(user, 'Profile updated successfully');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<StandardResponse<any>> {
    const user = await this.usersService.update(id, updateUserDto);
    return ResponseUtil.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<StandardResponse<any>> {
    await this.usersService.remove(id);
    return ResponseUtil.success(null, 'User deleted successfully');
  }
}

