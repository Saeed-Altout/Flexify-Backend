import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { BaseService } from '../../core/services/base.service';
import { SupabaseService } from '../../core/lib/supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  IAuthResponse,
  IAuthTokens,
  IRefreshTokenResponse,
} from './types/auth.types';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService extends BaseService {
  private readonly BCRYPT_ROUNDS = 10;
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 24;

  constructor(
    supabaseService: SupabaseService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {
    super(supabaseService);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: IAuthResponse['user']; verificationToken: string }> {
    const supabase = this.getClient();
    let userId: string | null = null;

    try {
      // Create user
      const user = await this.usersService.create({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      userId = user.id;

      // Don't generate tokens - user must verify email first
      // Tokens will be provided after email verification and login

      // Create email verification token and OTP
      const { verificationToken, otp } =
        await this.createEmailVerificationToken(user.id);

      // Send welcome email with OTP - if this fails, rollback user creation
      await this.mailerService.sendWelcomeEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        otp,
      });

      return {
        user: this.mapToAuthUser(user),
        verificationToken,
      };
    } catch (error) {
      // If email sending failed and user was created, rollback by deleting the user
      if (userId) {
        try {
          // Delete user if email failed
          await supabase.from('users').delete().eq('id', userId);
          // Also delete any tokens that were created
          await supabase
            .from('email_verification_tokens')
            .delete()
            .eq('user_id', userId);
        } catch (rollbackError) {
          // Log rollback failure but don't throw - original error is more important
        }
      }

      // Re-throw the original error with more context
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Provide translated error message
      throw new BadRequestException('auth.register.emailSendFailed');
    }
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    const supabase = this.getClient();

    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('auth.login.invalid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('auth.login.inactive');
    }

    // Get password hash and verify in one optimized query
    const { data: userData } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (!userData) {
      throw new UnauthorizedException('auth.login.invalid');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userData.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.login.invalid');
    }

    // Update last login (non-blocking)
    this.usersService.updateLastLogin(user.id).catch(() => {
      // Silently fail - not critical
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user: this.mapToAuthUser(user),
      tokens,
    };
  }

  /**
   * Map IUser to IAuthResponse user format
   */
  private mapToAuthUser(user: any): IAuthResponse['user'] {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      role: user.role,
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<IRefreshTokenResponse> {
    const supabase = this.getClient();

    // Find refresh token
    const { data: tokenData, error } = await supabase
      .from('refresh_tokens')
      .select('id, user_id, expires_at')
      .eq('token', refreshTokenDto.refreshToken)
      .eq('is_revoked', false)
      .maybeSingle();

    if (error || !tokenData) {
      throw new UnauthorizedException('auth.refreshToken.invalid');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new UnauthorizedException('auth.refreshToken.expired');
    }

    // Generate new tokens and revoke old token in parallel
    const [tokens] = await Promise.all([
      this.generateTokens(tokenData.user_id),
      supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenData.id),
    ]);

    return tokens;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Create password reset token and send email
    const resetLink = await this.createPasswordResetToken(user.id);

    // Send password reset email (non-blocking)
    this.mailerService
      .sendPasswordResetEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        resetLink,
      })
      .catch(() => {
        // Silently fail - not critical
      });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const supabase = this.getClient();

    // Find password reset token
    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at')
      .eq('token', resetPasswordDto.token)
      .is('used_at', null)
      .maybeSingle();

    if (error || !tokenData) {
      throw new BadRequestException('auth.resetPassword.invalidToken');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new BadRequestException('auth.resetPassword.tokenExpired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(
      resetPasswordDto.password,
      this.BCRYPT_ROUNDS,
    );

    // Update password and mark token as used in parallel
    await Promise.all([
      supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', tokenData.user_id),
      supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id),
    ]);

    // Send confirmation email (non-blocking)
    this.sendPasswordResetConfirmation(tokenData.user_id).catch(() => {
      // Silently fail - not critical
    });
  }

  /**
   * Send password reset confirmation email (helper method)
   */
  private async sendPasswordResetConfirmation(userId: string): Promise<void> {
    const supabase = this.getClient();
    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userData) {
      await this.mailerService.sendPasswordResetConfirmationEmail(
        userData.email,
        {
          firstName: userData.first_name,
          lastName: userData.last_name,
        },
      );
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const supabase = this.getClient();

    // Find verification token by ID (verificationToken) and OTP
    const { data: tokenData, error } = await supabase
      .from('email_verification_tokens')
      .select('id, user_id, expires_at')
      .eq('id', verifyEmailDto.verificationToken)
      .eq('token', verifyEmailDto.otp)
      .is('used_at', null)
      .maybeSingle();

    if (error || !tokenData) {
      throw new BadRequestException('auth.verify.invalidCode');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new BadRequestException('auth.verify.codeExpired');
    }

    // Update user verification status and mark token as used in parallel
    await Promise.all([
      supabase
        .from('users')
        .update({ is_email_verified: true })
        .eq('id', tokenData.user_id),
      supabase
        .from('email_verification_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id),
    ]);
  }

  async getCurrentUser(userId: string): Promise<IAuthResponse['user']> {
    const user = await this.usersService.findOne(userId);
    return this.mapToAuthUser(user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const supabase = this.getClient();

    // Get current password hash
    const { data: userData } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (!userData) {
      throw new UnauthorizedException('auth.user.notFound');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      userData.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.changePassword.invalid');
    }

    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      this.BCRYPT_ROUNDS,
    );

    await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);
  }

  async resendVerificationOTP(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('auth.verify.alreadyVerified');
    }

    const supabase = this.getClient();

    // Revoke old tokens and generate new OTP in parallel
    const [{ otp }] = await Promise.all([
      this.createEmailVerificationToken(user.id),
      supabase
        .from('email_verification_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('used_at', null),
    ]);

    // Send verification email
    await this.mailerService.sendVerificationEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      otp,
    });
  }

  private async generateTokens(userId: string): Promise<IAuthTokens> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN');
    const jwtRefreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    if (!jwtSecret || !jwtExpiresIn || !jwtRefreshExpiresIn) {
      throw new Error(
        'JWT_SECRET, JWT_EXPIRES_IN, and JWT_REFRESH_EXPIRES_IN must be defined',
      );
    }

    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn as StringValue | number,
    });

    const refreshToken = uuidv4();
    const expiresIn = this.parseExpiresIn(jwtExpiresIn);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.parseExpiresIn(jwtRefreshExpiresIn),
    );

    const supabase = this.getClient();
    await supabase.from('refresh_tokens').insert({
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt.toISOString(),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private async createPasswordResetToken(userId: string): Promise<string> {
    const supabase = this.getClient();
    const token = uuidv4();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    await supabase.from('password_reset_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    return `${frontendUrl}/auth/reset-password?token=${token}`;
  }

  private async createEmailVerificationToken(userId: string): Promise<{
    verificationToken: string;
    otp: string;
  }> {
    const supabase = this.getClient();
    const otp = this.generateOTP(this.OTP_LENGTH);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Insert verification token record - the id will be used as verificationToken
    const { data: insertedToken, error } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token: otp,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (error || !insertedToken) {
      throw new BadRequestException('auth.verify.invalidCode');
    }

    return {
      verificationToken: insertedToken.id,
      otp,
    };
  }

  /**
   * Generate OTP code
   */
  private generateOTP(length: number = this.OTP_LENGTH): string {
    const digits = '0123456789';
    return Array.from({ length }, () =>
      digits.charAt(Math.floor(Math.random() * digits.length)),
    ).join('');
  }

  private parseExpiresIn(expiresIn: string): number {
    // Parse strings like "1h", "30m", "7d" to seconds
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }
}
