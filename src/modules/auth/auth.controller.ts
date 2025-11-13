import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Get,
  Req,
  Param,
  NotFoundException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { QuickRegisterDto } from './dtos/quick-register.dto';
import { ForgetPasswordDto } from './dtos/forget-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyAccountDto } from './dtos/verify-account.dto';
import { SessionGuard } from './guards/session.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseUtil } from 'src/core/utils/response';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';
import {
  SESSION_TOKEN_COOKIE_NAME,
  SESSION_EXPIRATION_MS,
} from 'src/constants/auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const user = await this.authService.register(registerDto, req);

    // Auto-login after registration
    const loginDto: LoginDto = {
      email: registerDto.email,
      password: registerDto.password,
    };
    const loginResult = await this.authService.login(loginDto, req);

    // Set HttpOnly cookie
    res.cookie(SESSION_TOKEN_COOKIE_NAME, loginResult.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRATION_MS,
      path: '/',
    });

    return ResponseUtil.success(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          email_verified: user.email_verified,
        },
        session_token: loginResult.session_token, // Include token for server actions
      },
      TranslationUtil.translate('auth.register.success', lang),
      lang,
    );
  }

  @Post('quick-register')
  @HttpCode(HttpStatus.CREATED)
  async quickRegister(
    @Body() quickRegisterDto: QuickRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const user = await this.authService.quickRegister(quickRegisterDto, req);

    // Auto-login after registration
    const loginDto: LoginDto = {
      email: quickRegisterDto.email,
      password: quickRegisterDto.password,
    };
    const loginResult = await this.authService.login(loginDto, req);

    // Set HttpOnly cookie
    res.cookie(SESSION_TOKEN_COOKIE_NAME, loginResult.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRATION_MS,
      path: '/',
    });

    return ResponseUtil.success(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          email_verified: user.email_verified,
        },
        session_token: loginResult.session_token, // Include token for server actions
      },
      TranslationUtil.translate('auth.register.success', lang),
      lang,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const result = await this.authService.login(loginDto, req);

    // Set HttpOnly cookie
    res.cookie('NEXT_FLEXIFY_SESSION_TOKEN', result.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return ResponseUtil.success(
      {
        user: result.user,
        session_token: result.session_token, // Include token for server actions
      },
      TranslationUtil.translate('auth.login.success', lang),
      lang,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const lang = RequestUtil.getLanguage(req);
    const sessionToken = this.extractTokenFromRequest(req);

    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    // Clear cookie
    res.clearCookie(SESSION_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return ResponseUtil.success(
      undefined,
      TranslationUtil.translate('auth.logout.success', lang),
      lang,
    );
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async getCurrentUser(@CurrentUser() user: User, @Req() req: Request) {
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.success(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          avatar_url: user.avatar_url,
          language: user.language,
          timezone: user.timezone,
          created_at: user.created_at,
        },
      },
      TranslationUtil.translate('auth.me.success', lang),
      lang,
    );
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async verifySession(@CurrentUser() user: User, @Req() req: Request) {
    const lang = RequestUtil.getLanguage(req);
    return ResponseUtil.success(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      TranslationUtil.translate('auth.verify.success', lang),
      lang,
    );
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(
    @Body() forgetPasswordDto: ForgetPasswordDto,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    await this.authService.forgetPassword(forgetPasswordDto, req);

    return ResponseUtil.success(
      undefined,
      TranslationUtil.translate('auth.forgetPassword.success', lang),
      lang,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    await this.authService.resetPassword(resetPasswordDto, req);

    return ResponseUtil.success(
      undefined,
      TranslationUtil.translate('auth.resetPassword.success', lang),
      lang,
    );
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  async verifyAccount(
    @Body() verifyAccountDto: VerifyAccountDto,
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    await this.authService.verifyAccount(verifyAccountDto, req);

    return ResponseUtil.success(
      undefined,
      TranslationUtil.translate('auth.verifyAccount.success', lang),
      lang,
    );
  }

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(
    @Body() body: { email: string },
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    await this.authService.sendVerificationCode(body.email, req);

    return ResponseUtil.success(
      undefined,
      TranslationUtil.translate('auth.sendVerificationCode.success', lang),
      lang,
    );
  }

  @Post('resend-verification-code')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(
    @Body() body: { email: string },
    @Req() req: Request,
  ) {
    const lang = RequestUtil.getLanguage(req);
    await this.authService.resendVerificationCode(body.email, req);

    return ResponseUtil.success(
      undefined,
      TranslationUtil.translate('auth.resendVerificationCode.success', lang),
      lang,
    );
  }

  @Get('user/:id')
  @UseGuards(SessionGuard)
  async getUserById(@Param('id') id: string, @Req() req: Request) {
    const lang = RequestUtil.getLanguage(req);
    const user = await this.authService.getUserById(id);

    if (!user) {
      throw new NotFoundException(
        TranslationUtil.translate('auth.user.notFound', lang),
      );
    }

    return ResponseUtil.success(
      { user },
      TranslationUtil.translate('auth.me.success', lang),
      lang,
    );
  }

  @Get('user/email/:email')
  async getUserByEmail(@Param('email') email: string, @Req() req: Request) {
    const lang = RequestUtil.getLanguage(req);
    const user = await this.authService.getUserByEmail(email);

    if (!user) {
      throw new NotFoundException(
        TranslationUtil.translate('auth.user.notFound', lang),
      );
    }

    return ResponseUtil.success(
      { user },
      TranslationUtil.translate('auth.me.success', lang),
      lang,
    );
  }

  private extractTokenFromRequest(request: any): string | null {
    // Try to get token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from cookie
    if (request.cookies && request.cookies[SESSION_TOKEN_COOKIE_NAME]) {
      return request.cookies[SESSION_TOKEN_COOKIE_NAME];
    }

    return null;
  }
}
