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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
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

  @Patch(':id')
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

