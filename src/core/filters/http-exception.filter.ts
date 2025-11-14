import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { TranslationUtil } from '../utils/translations';
import { RequestUtil } from '../utils/request.util';

/**
 * Global exception filter for standardizing error responses
 * Follows best practices for error handling in NestJS
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = RequestUtil.getLanguage(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | object | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message =
          responseObj.message ||
          TranslationUtil.translate('errors.internal', lang);
        error = responseObj.error || undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.stack;
    }

    // Log error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Don't expose internal errors in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = TranslationUtil.translate('errors.internal', lang);
      error = undefined;
    }

    const errorResponse = ResponseUtil.error(message, error, lang);

    response.status(status).json(errorResponse);
  }
}

