import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto, UserSortBy, SortOrder } from './dto/query-user.dto';
import { IUser, IUsersListResponse } from './types/user.types';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  private getClient() {
    return this.supabaseService.getClient();
  }

  async create(createUserDto: CreateUserDto): Promise<IUser> {
    const supabase = this.getClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', createUserDto.email)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: createUserDto.email,
        password_hash: passwordHash,
        first_name: createUserDto.firstName || null,
        last_name: createUserDto.lastName || null,
        phone: createUserDto.phone || null,
        role: (createUserDto.role || UserRole.USER) as string,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }

    return this.mapToUser(user);
  }

  async findAll(queryDto: QueryUserDto): Promise<IUsersListResponse> {
    const supabase = this.getClient();
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = UserSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
      );
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (isEmailVerified !== undefined) {
      query = query.eq('is_email_verified', isEmailVerified);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === SortOrder.ASC });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }

    const users = (data || []).map((user) => this.mapToUser(user));
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<IUser> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUser(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToUser(data);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    const supabase = this.getClient();

    // Check if user exists
    await this.findOne(id);

    // If email is being updated, check for conflicts
    if (updateUserDto.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', updateUserDto.email)
        .neq('id', id)
        .single();

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updateData: any = {};

    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.firstName !== undefined) {
      updateData.first_name = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      updateData.last_name = updateUserDto.lastName;
    }
    if (updateUserDto.avatarUrl !== undefined) {
      updateData.avatar_url = updateUserDto.avatarUrl;
    }
    if (updateUserDto.phone !== undefined) {
      updateData.phone = updateUserDto.phone;
    }
    if (updateUserDto.isActive !== undefined) {
      updateData.is_active = updateUserDto.isActive;
    }
    if (updateUserDto.isEmailVerified !== undefined) {
      updateData.is_email_verified = updateUserDto.isEmailVerified;
    }
    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }

    return this.mapToUser(data);
  }

  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if user exists
    await this.findOne(id);

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  async deleteById(id: string): Promise<void> {
    const supabase = this.getClient();

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    const supabase = this.getClient();

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id);
  }

  private mapToUser(data: any): IUser {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      isEmailVerified: data.is_email_verified,
      isActive: data.is_active,
      role: data.role,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

