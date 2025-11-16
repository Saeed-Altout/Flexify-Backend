import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseService } from '../../core/services/base.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto, UserSortBy, SortOrder } from './dto/query-user.dto';
import { IUser, IUsersListResponse } from './types/user.types';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService extends BaseService {
  private readonly BCRYPT_ROUNDS = 10;
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;

  async create(createUserDto: CreateUserDto): Promise<IUser> {
    const supabase = this.getClient();

    // Check if user already exists using optimized exists method
    if (await this.exists('users', 'email', createUserDto.email)) {
      throw new ConflictException('users.create.emailExists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, this.BCRYPT_ROUNDS);

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

    if (error || !user) {
      throw new BadRequestException('users.create.failed');
    }

    return this.mapToUser(user);
  }

  async findAll(queryDto: QueryUserDto): Promise<IUsersListResponse> {
    const supabase = this.getClient();
    const {
      page = this.DEFAULT_PAGE,
      limit = this.DEFAULT_LIMIT,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = UserSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply filters efficiently
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
      );
    }

    if (role) query = query.eq('role', role);
    if (isActive !== undefined) query = query.eq('is_active', isActive);
    if (isEmailVerified !== undefined) query = query.eq('is_email_verified', isEmailVerified);

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === SortOrder.ASC })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException('users.findAll.failed');
    }

    return {
      users: (data || []).map((user) => this.mapToUser(user)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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
      throw new NotFoundException('users.findOne.notFound');
    }

    return this.mapToUser(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    return error || !data ? null : this.mapToUser(data);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    const supabase = this.getClient();

    // Check if user exists
    await this.findOne(id);

    // If email is being updated, check for conflicts
    if (updateUserDto.email && (await this.exists('users', 'email', updateUserDto.email, id))) {
      throw new ConflictException('users.update.emailExists');
    }

    // Build update data object efficiently
    const updateData = this.buildUpdateData(updateUserDto);

    if (Object.keys(updateData).length === 0) {
      // No changes, return existing user
      return this.findOne(id);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException('users.update.failed');
    }

    return this.mapToUser(data);
  }

  /**
   * Build update data object from DTO
   */
  private buildUpdateData(dto: UpdateUserDto): Record<string, any> {
    const updateData: Record<string, any> = {};
    // Only map fields that are allowed to be updated (excludes password)
    const fieldMapping: Partial<Record<keyof UpdateUserDto, string>> = {
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      avatarUrl: 'avatar_url',
      phone: 'phone',
      isActive: 'is_active',
      isEmailVerified: 'is_email_verified',
      role: 'role',
    };

    for (const [key, value] of Object.entries(dto)) {
      const dbField = fieldMapping[key as keyof UpdateUserDto];
      if (value !== undefined && dbField) {
        updateData[dbField] = value;
      }
    }

    return updateData;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.getClient();

    // Check if user exists
    await this.findOne(id);

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new BadRequestException('users.delete.failed');
    }
  }

  /**
   * Internal method for rollback operations (no existence check)
   * Used by auth service for registration rollback
   */
  async deleteById(id: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new BadRequestException('users.delete.failed');
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const supabase = this.getClient();

    // Check if user exists
    await this.findOne(userId);

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      // Fallback to placeholder if storage fails
      const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userId)}`;
      await supabase.from('users').update({ avatar_url: placeholderUrl }).eq('id', userId);
      return placeholderUrl;
    }

    // Get public URL and update user
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl;

    await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);

    return avatarUrl;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.getClient()
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

