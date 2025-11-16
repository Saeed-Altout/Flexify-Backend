import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { User } from '../users/types/user.type';
import { Session } from './types/session.type';
import { LoginDto } from './dtos/login.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { ForgetPasswordDto } from './dtos/forget-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyAccountDto } from './dtos/verify-account.dto';
import { QuickRegisterDto } from './dtos/quick-register.dto';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto, req: Request): Promise<User> {
    const lang = RequestUtil.getLanguage(req);

    // Check if user already exists
    const existingUser = await this.supabase.getUserByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(
        TranslationUtil.translate('auth.register.emailExists', lang),
      );
    }

    // Check if phone is provided and already exists
    if (registerDto.phone) {
      // Note: You may need to add a getUserByPhone method to SupabaseService
      // For now, we'll skip this check or implement it in SupabaseService
    }

    // Extract language from request header
    const requestLang = RequestUtil.getLanguage(req);

    // Create user using SupabaseService
    const passwordHash = await this.supabase.hashPassword(registerDto.password);
    const user = await this.supabase.createUser(
      registerDto.email,
      `${registerDto.first_name || ''} ${registerDto.last_name || ''}`.trim() ||
        registerDto.email,
      registerDto.password,
    );

    // Update user with additional fields
    const updatedUser = await this.supabase.updateUser(user.id, {
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      phone: registerDto.phone,
      language: requestLang,
      status: 'active',
      email_verified: false,
      phone_verified: false,
      role: 'user',
    } as any);

    // Send welcome email
    try {
      const userName = updatedUser.name || registerDto.email;
      await this.mailerService.sendWelcomeEmail(updatedUser.email, userName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return updatedUser as User;
  }

  async login(loginDto: LoginDto, req: Request): Promise<LoginResponseDto> {
    const lang = RequestUtil.getLanguage(req);

    // Find user by email
    const user = await this.supabase.getUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.login.invalid', lang),
      );
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.login.inactive', lang),
      );
    }

    // Verify password
    if (!user.password_hash) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.login.noPassword', lang),
      );
    }

    const isPasswordValid = await this.supabase.verifyPassword(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.login.invalid', lang),
      );
    }

    // Generate session token
    const sessionToken = randomUUID();
    const tokenHash = this.supabase.generateTokenHash(sessionToken);

    // Calculate expiration (default 7 days)
    const expiresIn =
      this.configService.get<string>('SESSION_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpirationDate(expiresIn);

    // Extract IP and user agent
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;
    const deviceName = this.extractDeviceName(userAgent);

    // Create session
    const session = await this.supabase.createSession(
      user.id,
      tokenHash,
      expiresAt.toISOString(),
      ipAddress,
      userAgent || undefined,
    );

    // Update user's last login
    await this.supabase.updateUser(user.id, {
      last_login_at: new Date().toISOString(),
    } as any);

    const nameParts = user.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: user.role,
        email_verified: user.email_verified,
      },
      session_token: sessionToken,
    };
  }

  async verifySession(sessionToken: string): Promise<Session | null> {
    const tokenHash = this.supabase.generateTokenHash(sessionToken);
    const session = await this.supabase.getSessionByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    // Get user to check if active
    const user = await this.supabase.getUserById(session.user_id);
    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: session.id,
      user_id: session.user_id,
      user: user as any,
      session_token: sessionToken,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      device_name: session.user_agent
        ? this.extractDeviceName(session.user_agent)
        : null,
      expires_at: new Date(session.expires_at),
      revoked_at: session.is_active ? null : new Date(),
      created_at: new Date(session.created_at),
      updated_at: new Date(session.updated_at),
    };
  }

  async logout(sessionToken: string): Promise<void> {
    const tokenHash = this.supabase.generateTokenHash(sessionToken);
    const session = await this.supabase.getSessionByTokenHash(tokenHash);

    if (session) {
      await this.supabase.invalidateSession(session.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.supabase.invalidateUserSessions(userId);
  }

  async quickRegister(
    quickRegisterDto: QuickRegisterDto,
    req: Request,
  ): Promise<User> {
    const registerDto: RegisterDto = {
      email: quickRegisterDto.email,
      password: quickRegisterDto.password,
    };
    return this.register(registerDto, req);
  }

  async forgetPassword(
    forgetPasswordDto: ForgetPasswordDto,
    req: Request,
  ): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const user = await this.supabase.getUserByEmail(forgetPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    // Generate reset token
    const token = randomUUID();

    // Create password reset token
    await this.supabase.createPasswordResetToken(user.email, token);

    // Send email with reset link
    try {
      await this.mailerService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    req: Request,
  ): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const email = await this.supabase.verifyPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!email) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.resetPassword.invalidToken', lang),
      );
    }

    // Hash new password
    const passwordHash = await this.supabase.hashPassword(
      resetPasswordDto.password,
    );

    // Update user password
    const user = await this.supabase.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException(
        TranslationUtil.translate('auth.user.notFound', lang),
      );
    }

    await this.supabase.updateUser(user.id, {
      password_hash: passwordHash,
    } as any);

    // Delete reset token
    await this.supabase.deletePasswordResetToken(resetPasswordDto.token);
  }

  async sendVerificationCode(email: string, req: Request): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const user = await this.supabase.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException(
        TranslationUtil.translate('auth.user.notFound', lang),
      );
    }

    if (user.email_verified) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.verify.alreadyVerified', lang),
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create OTP record
    await this.supabase.createOtpRecord(email, code);

    // Send email with verification code
    try {
      await this.mailerService.sendVerificationCode(user.email, code);
    } catch (error) {
      console.error('Failed to send verification code email:', error);
    }
  }

  async verifyAccount(
    verifyAccountDto: VerifyAccountDto,
    req: Request,
  ): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const user = await this.supabase.getUserByEmail(verifyAccountDto.email);
    if (!user) {
      throw new NotFoundException(
        TranslationUtil.translate('auth.user.notFound', lang),
      );
    }

    const isValid = await this.supabase.verifyOtp(
      verifyAccountDto.email,
      verifyAccountDto.code,
    );

    if (!isValid) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.verify.invalidCode', lang),
      );
    }

    // Verify user email
    await this.supabase.updateUser(user.id, {
      email_verified: true,
    } as any);
  }

  async resendVerificationCode(email: string, req: Request): Promise<void> {
    await this.sendVerificationCode(email, req);
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await this.supabase.getUserById(userId);
    return user as User | null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.supabase.getUserByEmail(email);
    return user as User | null;
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([dhms])$/);

    if (!match) {
      now.setDate(now.getDate() + 7);
      return now;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
    }

    return now;
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private extractDeviceName(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';

    if (userAgent.includes('Mobile')) {
      return 'Mobile';
    } else if (userAgent.includes('Tablet')) {
      return 'Tablet';
    } else if (userAgent.includes('Windows')) {
      return 'Windows';
    } else if (userAgent.includes('Mac')) {
      return 'Mac';
    } else if (userAgent.includes('Linux')) {
      return 'Linux';
    }

    return 'Desktop';
  }
}

