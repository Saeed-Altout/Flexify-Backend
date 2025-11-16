import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';
import { User } from './types/user.type';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.supabase.getUserById(id);
    return user as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.supabase.getUserByEmail(email);
    return user as User | null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const updatedUser = await this.supabase.updateUser(id, updates);
    return updatedUser as User;
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const updatedUser = await this.supabase.updateUserAvatar(id, avatarUrl);
    return updatedUser as User;
  }

  async getAllUsers(query: {
    role?: string;
    is_active?: boolean;
    email_verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }) {
    return await this.supabase.getAllUsers(query);
  }

  async getUserStats() {
    return await this.supabase.getUserStats();
  }
}
