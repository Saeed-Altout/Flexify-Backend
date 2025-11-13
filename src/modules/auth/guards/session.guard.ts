import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TranslationUtil } from 'src/core/utils/translations';
import { RequestUtil } from 'src/core/utils/request.util';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const lang = RequestUtil.getLanguage(request);
    const sessionToken = this.extractTokenFromRequest(request);

    if (!sessionToken) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.session.required', lang),
      );
    }

    const session = await this.authService.verifySession(sessionToken);

    if (!session) {
      throw new UnauthorizedException(
        TranslationUtil.translate('auth.session.invalid', lang),
      );
    }

    // Attach user and session to request
    request.user = session.user;
    request.session = session;

    return true;
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

    // Try to get token from query parameter (for testing)
    if (request.query && request.query.session_token) {
      return request.query.session_token;
    }

    return null;
  }
}

