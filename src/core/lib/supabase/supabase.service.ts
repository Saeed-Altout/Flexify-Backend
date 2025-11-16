import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Session, UserRole } from './types/auth.types';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  public supabase: SupabaseClient;
  private isDevelopmentMode = false;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  // In-memory tracking for development mode
  private devVerifiedUsers = new Set<string>();

  constructor(private configService: ConfigService) {
    const supabaseUrl = 
      this.configService.get<string>('SUPABASE_URL') ||
      this.configService.get<string>('supabase.url');
    const supabaseServiceKey = 
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('supabase.serviceKey');
    this.jwtSecret =
      this.configService.get<string>('jwt.secret') || 'your-secret-key';
    this.jwtRefreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      'your-refresh-secret-key';

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.warn(
        'Supabase configuration is missing. Running in development mode.',
      );
      this.isDevelopmentMode = true;
      this.supabase = createClient(
        supabaseUrl || 'https://dummy.supabase.co',
        supabaseServiceKey || 'dummy-key',
      );
    } else {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
  }

  // =====================================================
  // USER OPERATIONS
  // =====================================================

  async createUser(
    email: string,
    name: string,
    password: string,
  ): Promise<User> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn(
          'Running in development mode with dummy Supabase config',
        );
        // Track this user as verified in development mode
        this.devVerifiedUsers.add(email);
        return {
          id: 'dev-user-id',
          email,
          name,
          password_hash: 'dev-hash',
          role: 'USER',
          is_active: true,
          email_verified: true, // Set to true in development mode for testing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          email,
          name,
          password_hash: passwordHash,
          role: 'USER',
          is_active: true,
          email_verified: false,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating user: ${error.message}`);
        throw new Error(`Failed to create user: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create user');
      }

      this.logger.log(`Successfully created user: ${data.id}`);
      return data;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error in createUser: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async createVerifiedUser(
    email: string,
    name: string,
    passwordHash: string,
  ): Promise<User> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn(
          'Running in development mode with dummy Supabase config',
        );
        // Track this user as verified in development mode
        this.devVerifiedUsers.add(email);
        return {
          id: 'dev-user-id',
          email,
          name,
          password_hash: passwordHash,
          role: 'USER',
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create user with email_verified: true from the start
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          email,
          name,
          password_hash: passwordHash,
          role: 'USER',
          is_active: true,
          email_verified: true, // Verified from the start
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating verified user: ${error.message}`);
        throw new Error(`Failed to create verified user: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create verified user');
      }

      this.logger.log(`Successfully created verified user: ${data.id}`);
      return data;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error in createVerifiedUser: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, check if user has been verified
        if (this.devVerifiedUsers.has(email)) {
          // User has been verified, return mock user
          return {
            id: 'dev-user-id',
            email,
            name: 'Development User',
            password_hash: 'dev-hash',
            role: 'USER',
            is_active: true,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        // User not verified yet, return null
        return null;
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Error in getUserByEmail: ${error.message}`);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      if (this.isDevelopmentMode) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Error in getUserById: ${error.message}`);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('Running in development mode');
        return {
          id,
          email: 'dev@example.com',
          name: 'Dev User',
          password_hash: 'dev-hash',
          role: 'USER',
          is_active: true,
          email_verified: updates.email_verified ?? true, // Use the provided value or default to true
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating user: ${error.message}`);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      if (!data) {
        throw new Error('User not found');
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error in updateUser: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async updateUserAvatar(id: string, avatarUrl: string): Promise<User> {
    try {
      return await this.updateUser(id, {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error updating user avatar: ${error.message}`);
      throw error;
    }
  }

  async updateUserCVFile(
    id: string,
    cvFileUrl: string,
    cvFileName: string,
    cvFileSize: number,
  ): Promise<User> {
    try {
      return await this.updateUser(id, {
        cv_file_url: cvFileUrl,
        cv_file_name: cvFileName,
        cv_file_size: cvFileSize,
        cv_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      this.logger.error(`Error updating user CV file: ${error.message}`);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error: any) {
      this.logger.error(`Error hashing password: ${error.message}`);
      throw error;
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error: any) {
      this.logger.error(`Error verifying password: ${error.message}`);
      return false;
    }
  }

  // =====================================================
  // SESSION OPERATIONS
  // =====================================================

  async createSession(
    userId: string,
    tokenHash: string,
    expiresAt: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('Running in development mode');
        return {
          id: 'dev-session-id',
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt,
          is_active: true,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const { data, error } = await this.supabase
        .from('sessions')
        .insert({
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt,
          is_active: true,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating session: ${error.message}`);
        throw new Error(`Failed to create session: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create session');
      }

      return data;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error in createSession: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async getSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    try {
      if (this.isDevelopmentMode) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Error in getSessionByTokenHash: ${error.message}`);
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        return;
      }

      const { error } = await this.supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) {
        this.logger.error(`Error invalidating session: ${error.message}`);
        throw new Error(`Failed to invalidate session: ${error.message}`);
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error in invalidateSession: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        return;
      }

      const { error } = await this.supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Error invalidating user sessions: ${error.message}`);
        throw new Error(`Failed to invalidate user sessions: ${error.message}`);
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error in invalidateUserSessions: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        return;
      }

      const { error } = await this.supabase.rpc('clean_expired_sessions');
      if (error) {
        this.logger.error(`Error cleaning expired sessions: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in cleanExpiredSessions: ${error.message}`);
    }
  }

  // =====================================================
  // JWT OPERATIONS
  // =====================================================

  generateAccessToken(payload: any): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '15m' });
  }

  generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  verifyJwtToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      return null;
    }
  }

  generateTokenHash(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  // =====================================================
  // OTP AND PASSWORD RESET OPERATIONS
  // =====================================================

  async createOtpRecord(email: string, otp: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('createOtpRecord called in development mode');
        return;
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error } = await this.supabase.from('otp_verifications').upsert(
        {
          email,
          otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
        },
      );

      if (error) {
        this.logger.error(`Error creating OTP record: ${error.message}`);
        throw new Error(`Failed to create OTP record: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in createOtpRecord: ${error.message}`);
      throw error;
    }
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('verifyOtp called in development mode');
        return true;
      }

      const { data, error } = await this.supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if OTP is expired
      if (new Date(data.expires_at) < new Date()) {
        return false;
      }

      // Delete the OTP record after successful verification
      await this.supabase
        .from('otp_verifications')
        .delete()
        .eq('email', email)
        .eq('otp', otp);

      return true;
    } catch (error: any) {
      this.logger.error(`Error in verifyOtp: ${error.message}`);
      return false;
    }
  }

  async createPasswordResetToken(email: string, token: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('createPasswordResetToken called in development mode');
        return;
      }

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const { error } = await this.supabase
        .from('password_reset_tokens')
        .upsert(
          {
            email,
            token,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'email',
          },
        );

      if (error) {
        this.logger.error(
          `Error creating password reset token: ${error.message}`,
        );
        throw new Error(
          `Failed to create password reset token: ${error.message}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error in createPasswordResetToken: ${error.message}`);
      throw error;
    }
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('verifyPasswordResetToken called in development mode');
        return 'dev@example.com';
      }

      const { data, error } = await this.supabase
        .from('password_reset_tokens')
        .select('email, expires_at')
        .eq('token', token)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if token is expired
      if (new Date(data.expires_at) < new Date()) {
        return null;
      }

      return data.email;
    } catch (error: any) {
      this.logger.error(`Error in verifyPasswordResetToken: ${error.message}`);
      return null;
    }
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('deletePasswordResetToken called in development mode');
        return;
      }

      const { error } = await this.supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      if (error) {
        this.logger.error(
          `Error deleting password reset token: ${error.message}`,
        );
        throw new Error(
          `Failed to delete password reset token: ${error.message}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error in deletePasswordResetToken: ${error.message}`);
      throw error;
    }
  }

  async createRefreshTokenRecord(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('createRefreshTokenRecord called in development mode');
        return;
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const tokenHash = this.generateTokenHash(refreshToken);

      const { error } = await this.supabase.from('refresh_tokens').insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      if (error) {
        this.logger.error(
          `Error creating refresh token record: ${error.message}`,
        );
        throw new Error(
          `Failed to create refresh token record: ${error.message}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error in createRefreshTokenRecord: ${error.message}`);
      throw error;
    }
  }

  async verifyRefreshToken(refreshToken: string): Promise<string | null> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('verifyRefreshToken called in development mode');
        return 'dev-user-id';
      }

      const tokenHash = this.generateTokenHash(refreshToken);

      const { data, error } = await this.supabase
        .from('refresh_tokens')
        .select('user_id, expires_at, is_active')
        .eq('token_hash', tokenHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if token is expired
      if (new Date(data.expires_at) < new Date()) {
        return null;
      }

      return data.user_id;
    } catch (error: any) {
      this.logger.error(`Error in verifyRefreshToken: ${error.message}`);
      return null;
    }
  }

  async invalidateRefreshToken(refreshToken: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('invalidateRefreshToken called in development mode');
        return;
      }

      const tokenHash = this.generateTokenHash(refreshToken);

      const { error } = await this.supabase
        .from('refresh_tokens')
        .update({ is_active: false })
        .eq('token_hash', tokenHash);

      if (error) {
        this.logger.error(`Error invalidating refresh token: ${error.message}`);
        throw new Error(`Failed to invalidate refresh token: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in invalidateRefreshToken: ${error.message}`);
      throw error;
    }
  }

  async invalidateUserRefreshTokens(userId: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn(
          'invalidateUserRefreshTokens called in development mode',
        );
        return;
      }

      const { error } = await this.supabase
        .from('refresh_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        this.logger.error(
          `Error invalidating user refresh tokens: ${error.message}`,
        );
        throw new Error(
          `Failed to invalidate user refresh tokens: ${error.message}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error in invalidateUserRefreshTokens: ${error.message}`,
      );
      throw error;
    }
  }

  // =====================================================
  // GENERAL DATABASE OPERATIONS
  // =====================================================

  async insert(table: string, data: Record<string, any>) {
    if (this.isDevelopmentMode) {
      this.logger.warn(`insert called in development mode for table: ${table}`);
      return { data: { id: 'dev-id', ...data }, error: null };
    }
    return await this.supabase.from(table).insert(data).select().single();
  }

  async select(
    table: string,
    query?: {
      eq?: Record<string, any>;
      order?: { column: string; options: any };
    },
  ) {
    if (this.isDevelopmentMode) {
      this.logger.warn(`select called in development mode for table: ${table}`);
      return { data: [], error: null };
    }

    let queryBuilder = this.supabase.from(table).select('*');

    if (query) {
      if (query.eq) {
        Object.entries(query.eq).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }
      if (query.order) {
        queryBuilder = queryBuilder.order(
          query.order.column,
          query.order.options,
        );
      }
    }

    return await queryBuilder;
  }

  async update(
    table: string,
    data: Record<string, any>,
    eq: Record<string, any>,
  ) {
    if (this.isDevelopmentMode) {
      this.logger.warn(`update called in development mode for table: ${table}`);
      return { data: { id: 'dev-id', ...data }, error: null };
    }

    let queryBuilder = this.supabase.from(table).update(data);

    if (eq) {
      Object.entries(eq).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    return await queryBuilder.select().single();
  }

  async delete(table: string, eq: Record<string, any>) {
    if (this.isDevelopmentMode) {
      this.logger.warn(`delete called in development mode for table: ${table}`);
      return { error: null };
    }

    let queryBuilder = this.supabase.from(table).delete();

    if (eq) {
      Object.entries(eq).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    return await queryBuilder;
  }

  // =====================================================
  // USER MANAGEMENT OPERATIONS (Admin Only)
  // =====================================================

  async getAllUsers(query: {
    role?: string;
    is_active?: boolean;
    email_verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ data: User[]; count: number; error: any }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('getAllUsers called in development mode');
        return {
          data: [
            {
              id: 'dev-user-1',
              email: 'admin@example.com',
              name: 'Admin User',
              password_hash: 'dev-hash',
              role: 'ADMIN',
              is_active: true,
              email_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'dev-user-2',
              email: 'user@example.com',
              name: 'Regular User',
              password_hash: 'dev-hash',
              role: 'USER',
              is_active: true,
              email_verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          count: 2,
          error: null,
        };
      }

      const page = query.page || 1;
      const limit = Math.min(query.limit || 10, 100);
      const offset = (page - 1) * limit;

      let queryBuilder = this.supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.role) {
        queryBuilder = queryBuilder.eq('role', query.role);
      }
      if (query.is_active !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', query.is_active);
      }
      if (query.email_verified !== undefined) {
        queryBuilder = queryBuilder.eq('email_verified', query.email_verified);
      }
      if (query.search) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query.search}%,email.ilike.%${query.search}%`,
        );
      }

      // Apply sorting
      const sortBy = query.sort_by || 'created_at';
      const sortOrder = query.sort_order || 'desc';
      queryBuilder = queryBuilder.order(sortBy, {
        ascending: sortOrder === 'asc',
      });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, count, error } = await queryBuilder;

      if (error) {
        this.logger.error(`Error getting all users: ${error.message}`);
        throw new Error(`Failed to get users: ${error.message}`);
      }

      return { data: data || [], count: count || 0, error: null };
    } catch (error: any) {
      this.logger.error(`Error in getAllUsers: ${error.message}`);
      throw error;
    }
  }

  async getUserStats(): Promise<{
    data: {
      total: number;
      active: number;
      inactive: number;
      admins: number;
      users: number;
      verified: number;
      unverified: number;
      today: number;
      this_week: number;
      this_month: number;
    };
    error: any;
  }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('getUserStats called in development mode');
        return {
          data: {
            total: 100,
            active: 80,
            inactive: 20,
            admins: 5,
            users: 95,
            verified: 90,
            unverified: 10,
            today: 5,
            this_week: 20,
            this_month: 80,
          },
          error: null,
        };
      }

      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const startOfWeek = new Date(
        now.setDate(now.getDate() - 7),
      ).toISOString();
      const startOfMonth = new Date(
        now.setMonth(now.getMonth() - 1),
      ).toISOString();

      // Get total users
      const { count: total, error: totalError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get active users
      const { count: active, error: activeError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) throw activeError;

      // Get inactive users
      const { count: inactive, error: inactiveError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      if (inactiveError) throw inactiveError;

      // Get admin users
      const { count: admins, error: adminsError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ADMIN');

      if (adminsError) throw adminsError;

      // Get regular users
      const { count: users, error: usersError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'USER');

      if (usersError) throw usersError;

      // Get verified users
      const { count: verified, error: verifiedError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', true);

      if (verifiedError) throw verifiedError;

      // Get unverified users
      const { count: unverified, error: unverifiedError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', false);

      if (unverifiedError) throw unverifiedError;

      // Get today's new users
      const { count: todayCount, error: todayError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay);

      if (todayError) throw todayError;

      // Get this week's new users
      const { count: this_week, error: weekError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek);

      if (weekError) throw weekError;

      // Get this month's new users
      const { count: this_month, error: monthError } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      if (monthError) throw monthError;

      return {
        data: {
          total: total || 0,
          active: active || 0,
          inactive: inactive || 0,
          admins: admins || 0,
          users: users || 0,
          verified: verified || 0,
          unverified: unverified || 0,
          today: todayCount || 0,
          this_week: this_week || 0,
          this_month: this_month || 0,
        },
        error: null,
      };
    } catch (error: any) {
      this.logger.error(`Error in getUserStats: ${error.message}`);
      throw error;
    }
  }

  async getUserSessions(userId: string): Promise<{ data: any[]; error: any }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('getUserSessions called in development mode');
        return {
          data: [
            {
              id: 'dev-session-1',
              user_id: userId,
              expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              is_active: true,
              ip_address: '192.168.1.1',
              user_agent: 'Mozilla/5.0...',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        };
      }

      const { data, error } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error getting user sessions: ${error.message}`);
        throw new Error(`Failed to get user sessions: ${error.message}`);
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      this.logger.error(`Error in getUserSessions: ${error.message}`);
      throw error;
    }
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<{ data: User; error: any }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('updateUserStatus called in development mode');
        return {
          data: {
            id: userId,
            email: 'user@example.com',
            name: 'Test User',
            password_hash: 'dev-hash',
            role: 'USER',
            is_active: isActive,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating user status: ${error.message}`);
        throw new Error(`Failed to update user status: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      this.logger.error(`Error in updateUserStatus: ${error.message}`);
      throw error;
    }
  }

  async updateUserRole(
    userId: string,
    role: UserRole,
  ): Promise<{ data: User; error: any }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('updateUserRole called in development mode');
        return {
          data: {
            id: userId,
            email: 'user@example.com',
            name: 'Test User',
            password_hash: 'dev-hash',
            role: role,
            is_active: true,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        };
      }

      const { data, error } = await this.supabase
        .from('users')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating user role: ${error.message}`);
        throw new Error(`Failed to update user role: ${error.message}`);
      }

      return { data, error: null };
    } catch (error: any) {
      this.logger.error(`Error in updateUserRole: ${error.message}`);
      throw error;
    }
  }

  async forceLogoutUser(userId: string): Promise<{ error: any }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('forceLogoutUser called in development mode');
        return { error: null };
      }

      // Invalidate all user sessions
      const { error } = await this.supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Error force logging out user: ${error.message}`);
        throw new Error(`Failed to force logout user: ${error.message}`);
      }

      return { error: null };
    } catch (error: any) {
      this.logger.error(`Error in forceLogoutUser: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<{ error: any }> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('deleteUser called in development mode');
        return { error: null };
      }

      // First, invalidate all user sessions
      await this.forceLogoutUser(userId);

      // Delete user from users table (this will cascade to related tables)
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        this.logger.error(`Error deleting user: ${error.message}`);
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      this.logger.log(`Successfully deleted user: ${userId}`);
      return { error: null };
    } catch (error: any) {
      this.logger.error(`Error in deleteUser: ${error.message}`);
      throw error;
    }
  }

  // =====================================================
  // TECHNOLOGY ICON OPERATIONS
  // =====================================================

  async updateTechnologyIcon(
    id: string,
    iconUrl: string,
    iconFilename: string,
    iconSize: number,
  ): Promise<any> {
    try {
      return await this.update(
        'technologies',
        {
          icon_url: iconUrl,
          icon_filename: iconFilename,
          icon_size: iconSize,
          icon_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { id },
      );
    } catch (error: any) {
      this.logger.error(`Error updating technology icon: ${error.message}`);
      throw error;
    }
  }

  async getTechnologyById(id: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('technologies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Error getting technology by ID: ${error.message}`);
      throw error;
    }
  }

  // =====================================================
  // PENDING SIGNUP OPERATIONS
  // =====================================================

  async createPendingSignup(
    email: string,
    name: string,
    passwordHash: string,
  ): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('createPendingSignup called in development mode');
        return;
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { error } = await this.supabase.from('pending_signups').upsert(
        {
          email,
          name,
          password_hash: passwordHash,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
        },
      );

      if (error) {
        this.logger.error(`Error creating pending signup: ${error.message}`);
        throw new Error(`Failed to create pending signup: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in createPendingSignup: ${error.message}`);
      throw error;
    }
  }

  async getPendingSignup(email: string): Promise<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
    created_at: string;
    expires_at: string;
  } | null> {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, check if user has been verified
        if (this.devVerifiedUsers.has(email)) {
          // User has been verified, no pending signup
          return null;
        }

        // User not verified yet, return mock pending signup
        this.logger.warn('getPendingSignup called in development mode');
        return {
          id: 'dev-id',
          email,
          name: 'Dev User',
          password_hash: 'dev-hash',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const { data, error } = await this.supabase
        .from('pending_signups')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No pending signup found
        }
        this.logger.error(`Error getting pending signup: ${error.message}`);
        throw new Error(`Failed to get pending signup: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      this.logger.error(`Error in getPendingSignup: ${error.message}`);
      throw error;
    }
  }

  async deletePendingSignup(email: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('deletePendingSignup called in development mode');
        return;
      }

      const { error } = await this.supabase
        .from('pending_signups')
        .delete()
        .eq('email', email);

      if (error) {
        this.logger.error(`Error deleting pending signup: ${error.message}`);
        throw new Error(`Failed to delete pending signup: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in deletePendingSignup: ${error.message}`);
      throw error;
    }
  }

  async deleteOtpRecord(email: string): Promise<void> {
    try {
      if (this.isDevelopmentMode) {
        this.logger.warn('deleteOtpRecord called in development mode');
        return;
      }

      const { error } = await this.supabase
        .from('otp_verifications')
        .delete()
        .eq('email', email);

      if (error) {
        this.logger.error(`Error deleting OTP record: ${error.message}`);
        throw new Error(`Failed to delete OTP record: ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in deleteOtpRecord: ${error.message}`);
      throw error;
    }
  }
}
