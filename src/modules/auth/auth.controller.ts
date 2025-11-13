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
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { SessionGuard } from './guards/session.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseUtil } from 'src/core/utils/response';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    res.cookie('session_token', result.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return ResponseUtil.success(
      { user: result.user },
      TranslationUtil.translate('auth.login.success', lang),
      lang,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const lang = RequestUtil.getLanguage(req);
    const sessionToken = this.extractTokenFromRequest(req);
    
    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    // Clear cookie
    res.clearCookie('session_token', {
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
  async getCurrentUser(
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
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

  private extractTokenFromRequest(request: any): string | null {
    // Try to get token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from cookie
    if (request.cookies && request.cookies.session_token) {
      return request.cookies.session_token;
    }

    return null;
  }
}

