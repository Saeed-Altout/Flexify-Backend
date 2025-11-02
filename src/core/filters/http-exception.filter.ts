import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { TranslationUtil } from '../utils/translations';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const lang = request.headers['accept-language'] || 'en';

    const exceptionResponse = exception.getResponse();
    let message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    // Translate validation errors if they are arrays
    if (Array.isArray(message)) {
      const translatedMessages = await this.translateValidationErrors(
        message,
        lang,
      );
      message = translatedMessages;
    }

    const errorResponse = ResponseUtil.error(
      message,
      process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      lang,
    );

    response.status(status).json(errorResponse);
  }

  private async translateValidationErrors(
    errors: string[],
    lang: string,
  ): Promise<string[]> {
    const translatedErrors: string[] = [];

    for (const error of errors) {
      const translatedMessage = await this.translateValidationError(
        error,
        lang,
      );
      translatedErrors.push(translatedMessage);
    }

    return translatedErrors;
  }

  private async translateValidationError(
    error: string,
    lang: string,
  ): Promise<string> {
    // Map common validation error patterns to translation keys
    const errorMappings: { [key: string]: string } = {
      'phone must be a valid phone number': 'validation.isPhoneNumber',
      'email must be an email': 'validation.isEmail',
      'name must be longer than or equal to 2 characters':
        'validation.minLength',
      'password must be longer than or equal to 6 characters':
        'validation.minLength',
      'name must be shorter than or equal to 50 characters':
        'validation.maxLength',
      'password must be shorter than or equal to 50 characters':
        'validation.maxLength',
    };

    // Check if we have a direct mapping
    const translationKey = errorMappings[error];
    if (translationKey) {
      try {
        const translatedMessage = TranslationUtil.translate(
          translationKey,
          lang,
        );
        if (translatedMessage !== translationKey) {
          return translatedMessage;
        }
      } catch (error) {
        // If translation fails, fall back to original message
      }
    }

    // Fall back to the original error message
    return error;
  }
}
