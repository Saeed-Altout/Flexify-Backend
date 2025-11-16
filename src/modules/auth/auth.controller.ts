import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<StandardResponse<any>> {
    const result = await this.authService.register(registerDto);
    return ResponseUtil.success(result, 'User registered successfully');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<StandardResponse<any>> {
    const result = await this.authService.login(loginDto);
    return ResponseUtil.success(result, 'Login successful');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<StandardResponse<any>> {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return ResponseUtil.success(result, 'Token refreshed successfully');
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<StandardResponse<any>> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseUtil.success(
      null,
      'If the email exists, a password reset link has been sent',
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<StandardResponse<any>> {
    await this.authService.resetPassword(resetPasswordDto);
    return ResponseUtil.success(null, 'Password reset successfully');
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<StandardResponse<any>> {
    await this.authService.verifyEmail(verifyEmailDto);
    return ResponseUtil.success(null, 'Email verified successfully');
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto): Promise<StandardResponse<any>> {
    await this.authService.resendVerificationOTP(resendVerificationDto.email);
    return ResponseUtil.success(null, 'Verification code sent successfully');
  }
}

