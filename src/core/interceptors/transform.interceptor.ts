import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseUtil } from '../utils/response';
import { RequestUtil } from '../utils/request.util';

/**
 * Response transformation interceptor
 * Ensures all responses follow the standard format
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const lang = RequestUtil.getLanguage(request);

    return next.handle().pipe(
      map((data) => {
        // If response is already formatted (has 'status' field), return as is
        if (data && typeof data === 'object' && 'status' in data) {
          return data;
        }

        // Otherwise, wrap in standard response format
        // This should not happen since controllers should always return formatted responses
        // But keeping as fallback for safety
        return ResponseUtil.success(data, undefined, lang);
      }),
    );
  }
}
