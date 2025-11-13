import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { LoginDto } from './dtos/login.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) {}

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
