import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
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
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  private getClient() {
    return this.supabaseService.getClient();
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
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          role: user.role,
        },
        verificationToken,
      };
    } catch (error) {
      // Log the actual error for debugging
      console.error('Registration error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

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
          console.log(`Rolled back user creation for user ID: ${userId}`);
        } catch (rollbackError) {
          console.error('Failed to rollback user creation:', rollbackError);
        }
      }

      // Re-throw the original error with more context
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Provide more detailed error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during email sending';
      throw new BadRequestException(
        `Failed to send verification email: ${errorMessage}. Account creation was cancelled.`,
      );
    }
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    const supabase = this.getClient();

    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Get password hash from database
    const { data: userData } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (!userData) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userData.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<IRefreshTokenResponse> {
    const supabase = this.getClient();

    // Find refresh token
    const { data: tokenData, error } = await supabase
      .from('refresh_tokens')
      .select('*, users(*)')
      .eq('token', refreshTokenDto.refreshToken)
      .eq('is_revoked', false)
      .single();

    if (error || !tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const userId = tokenData.user_id;

    // Generate new tokens
    const tokens = await this.generateTokens(userId);

    // Revoke old refresh token
    await supabase
      .from('refresh_tokens')
      .update({ is_revoked: true })
      .eq('id', tokenData.id);

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

    // Send password reset email
    try {
      await this.mailerService.sendPasswordResetEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        resetLink,
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to send password reset email:', error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const supabase = this.getClient();

    // Find password reset token
    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', resetPasswordDto.token)
      .is('used_at', null)
      .single();

    if (error || !tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 10);

    // Get user info for email
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', tokenData.user_id)
      .single();

    // Update user password
    await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', tokenData.user_id);

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Send password reset confirmation email
    if (userData) {
      try {
        await this.mailerService.sendPasswordResetConfirmationEmail(
          userData.email,
          {
            firstName: userData.first_name,
            lastName: userData.last_name,
          },
        );
      } catch (error) {
        console.error(
          'Failed to send password reset confirmation email:',
          error,
        );
      }
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const supabase = this.getClient();

    // Find verification token by ID (verificationToken) and OTP
    const { data: tokenData, error } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('id', verifyEmailDto.verificationToken)
      .eq('token', verifyEmailDto.otp)
      .is('used_at', null)
      .single();

    if (error || !tokenData) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new BadRequestException(
        'Verification code expired. Please request a new one.',
      );
    }

    // Update user email verification status
    await supabase
      .from('users')
      .update({ is_email_verified: true })
      .eq('id', tokenData.user_id);

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);
  }

  async getCurrentUser(userId: string): Promise<IAuthResponse['user']> {
    const user = await this.usersService.findOne(userId);
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

  async changePassword(
    userId: string,
    changePasswordDto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const supabase = this.getClient();

    // Get user
    const user = await this.usersService.findOne(userId);

    // Get current password hash
    const { data: userData } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!userData) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      userData.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
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
      throw new BadRequestException('Email is already verified');
    }

    // Revoke old tokens
    const supabase = this.getClient();
    await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('used_at', null);

    // Generate new OTP
    const { otp } = await this.createEmailVerificationToken(user.id);

    // Send verification email
    try {
      await this.mailerService.sendVerificationEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        otp,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }
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
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await supabase.from('password_reset_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    return resetLink;
  }

  private async createEmailVerificationToken(userId: string): Promise<{
    verificationToken: string;
    otp: string;
  }> {
    const supabase = this.getClient();

    // Generate 6-digit OTP
    const otp = this.generateOTP(6);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

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
      throw new BadRequestException('Failed to create verification token');
    }

    return {
      verificationToken: insertedToken.id,
      otp,
    };
  }

  private generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return otp;
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
