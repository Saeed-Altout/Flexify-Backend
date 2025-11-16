import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResponseUtil, StandardResponse } from '../../core/utils/response';
import { RequestUtil } from '../../core/utils/request.util';
import { UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.authService.register(registerDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(result, 'auth.register.success', lang);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.authService.login(loginDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(result, 'auth.login.success', lang);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    const result = await this.authService.refreshToken(refreshTokenDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(result, 'auth.refreshToken.success', lang);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.authService.forgotPassword(forgotPasswordDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(
      null,
      'auth.forgetPassword.success',
      lang,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.authService.resetPassword(resetPasswordDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'auth.resetPassword.success', lang);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.authService.verifyEmail(verifyEmailDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'auth.verifyAccount.success', lang);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Request() req: any,
  ): Promise<StandardResponse<any>> {
    await this.authService.resendVerificationOTP(resendVerificationDto.email);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'auth.resendVerificationCode.success', lang);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('auth.user.notAuthenticated');
    }
    const user = await this.authService.getCurrentUser(userId);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(user, 'auth.me.success', lang);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<StandardResponse<any>> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('auth.user.notAuthenticated');
    }
    await this.authService.changePassword(userId, changePasswordDto);
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.successSingle(null, 'auth.changePassword.success', lang);
  }
}

