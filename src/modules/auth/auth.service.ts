import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { LoginDto } from './dtos/login.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { ForgetPasswordDto } from './dtos/forget-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyAccountDto } from './dtos/verify-account.dto';
import { QuickRegisterDto } from './dtos/quick-register.dto';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';
import { NotFoundException } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto, req: Request): Promise<User> {
    const lang = RequestUtil.getLanguage(req);

    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        TranslationUtil.translate('auth.register.emailExists', lang),
      );
    }

    // Check if phone is provided and already exists
    if (registerDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: registerDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException(
          TranslationUtil.translate('auth.register.phoneExists', lang),
        );
      }
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(registerDto.password, saltRounds);

    // Extract language from request header
    const requestLang = RequestUtil.getLanguage(req);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password_hash,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      phone: registerDto.phone,
      language: requestLang,
      status: 'active',
      email_verified: false,
      phone_verified: false,
      role: 'user',
    });

    await this.userRepository.save(user);

    // Send welcome email
    try {
      const userName = user.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : undefined;
      await this.mailerService.sendWelcomeEmail(user.email, userName);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to send welcome email:', error);
    }

    return user;
  }

  async login(loginDto: LoginDto, req: Request): Promise<LoginResponseDto> {
    const lang = RequestUtil.getLanguage(req);

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.login.invalid', lang),
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
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

    const isPasswordValid = await bcrypt.compare(
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

    // Calculate expiration (default 7 days)
    const expiresIn =
      this.configService.get<string>('SESSION_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpirationDate(expiresIn);

    // Extract IP and user agent
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;
    const deviceName = this.extractDeviceName(userAgent);

    // Create session
    const session = this.sessionRepository.create({
      user_id: user.id,
      session_token: sessionToken,
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      device_name: deviceName || undefined,
      expires_at: expiresAt,
    });

    await this.sessionRepository.save(session);

    // Update user's last login
    user.last_login_at = new Date();
    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        email_verified: user.email_verified,
      },
      session_token: sessionToken,
    };
  }

  async verifySession(sessionToken: string): Promise<Session | null> {
    const session = await this.sessionRepository.findOne({
      where: { session_token: sessionToken },
      relations: ['user'],
    });

    if (!session) {
      return null;
    }

    // Check if session is revoked
    if (session.revoked_at) {
      return null;
    }

    // Check if session is expired
    if (session.expires_at < new Date()) {
      return null;
    }

    // Check if user is active
    if (session.user.status !== 'active') {
      return null;
    }

    // Update session's updated_at
    session.updated_at = new Date();
    await this.sessionRepository.save(session);

    return session;
  }

  async logout(sessionToken: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { session_token: sessionToken },
    });

    if (session && !session.revoked_at) {
      session.revoked_at = new Date();
      await this.sessionRepository.save(session);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ revoked_at: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
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

    const user = await this.userRepository.findOne({
      where: { email: forgetPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    // Generate reset token
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Invalidate any existing tokens for this user
    await this.passwordResetTokenRepository.update(
      { user_id: user.id, used: false },
      { used: true },
    );

    // Create new reset token
    const resetToken = this.passwordResetTokenRepository.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      used: false,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // Send email with reset link
    try {
      await this.mailerService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to send password reset email:', error);
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    req: Request,
  ): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token: resetPasswordDto.token },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.resetPassword.invalidToken', lang),
      );
    }

    if (resetToken.used) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.resetPassword.tokenUsed', lang),
      );
    }

    if (resetToken.expires_at < new Date()) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.resetPassword.tokenExpired', lang),
      );
    }

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(
      resetPasswordDto.password,
      saltRounds,
    );

    // Update user password
    resetToken.user.password_hash = password_hash;
    await this.userRepository.save(resetToken.user);

    // Mark token as used
    resetToken.used = true;
    await this.passwordResetTokenRepository.save(resetToken);
  }

  async sendVerificationCode(email: string, req: Request): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const user = await this.userRepository.findOne({
      where: { email },
    });

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
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

    // Invalidate any existing codes for this user
    await this.verificationCodeRepository.update(
      { user_id: user.id, type: 'email', used: false },
      { used: true },
    );

    // Create new verification code
    const verificationCode = this.verificationCodeRepository.create({
      user_id: user.id,
      code,
      type: 'email',
      expires_at: expiresAt,
      used: false,
    });

    await this.verificationCodeRepository.save(verificationCode);

    // Send email with verification code
    try {
      await this.mailerService.sendVerificationCode(user.email, code);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to send verification code email:', error);
    }
  }

  async verifyAccount(
    verifyAccountDto: VerifyAccountDto,
    req: Request,
  ): Promise<void> {
    const lang = RequestUtil.getLanguage(req);

    const user = await this.userRepository.findOne({
      where: { email: verifyAccountDto.email },
    });

    if (!user) {
      throw new NotFoundException(
        TranslationUtil.translate('auth.user.notFound', lang),
      );
    }

    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        user_id: user.id,
        code: verifyAccountDto.code,
        type: 'email',
        used: false,
      },
    });

    if (!verificationCode) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.verify.invalidCode', lang),
      );
    }

    if (verificationCode.expires_at < new Date()) {
      throw new BadRequestException(
        TranslationUtil.translate('auth.verify.codeExpired', lang),
      );
    }

    // Mark code as used
    verificationCode.used = true;
    await this.verificationCodeRepository.save(verificationCode);

    // Verify user email
    user.email_verified = true;
    await this.userRepository.save(user);
  }

  async resendVerificationCode(email: string, req: Request): Promise<void> {
    await this.sendVerificationCode(email, req);
  }

  async getUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([dhms])$/);

    if (!match) {
      // Default to 7 days if format is invalid
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

    // Simple device name extraction
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
