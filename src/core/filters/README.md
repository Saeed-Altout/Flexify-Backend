# Filters Directory (`filters/`)

This directory contains exception filters that catch and handle errors, providing consistent error responses across the application.

## 📁 Available Filters

```
filters/
└── http-exception.filter.ts   # Global HTTP exception handler
```

## 🎯 Purpose

Filters provide:

- **Error Handling**: Catch and handle exceptions globally
- **Response Formatting**: Standardize error response format
- **Error Translation**: Translate error messages to user's language
- **Logging**: Log errors for debugging
- **Status Codes**: Map exceptions to appropriate HTTP status codes

## 💡 How It Works

### HTTP Exception Filter (`http-exception.filter.ts`)

Catches all `HttpException` instances and formats them:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
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

    // Translate validation errors
    if (Array.isArray(message)) {
      message = await this.translateValidationErrors(message, lang);
    }

    const errorResponse = ResponseUtil.error(
      message,
      process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      lang,
    );

    response.status(status).json(errorResponse);
  }
}
```

**Registered Globally** in `app.module.ts`:

```typescript
{
  provide: APP_FILTER,
  useClass: HttpExceptionFilter,
}
```

**Error Response Format**:

```typescript
{
  success: false,
  message: "Error message",  // or array of validation errors
  error: "Stack trace in development",
  lang: "en",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## 📝 How Errors Are Handled

### Validation Errors

When DTO validation fails:

```typescript
// Thrown automatically by ValidationPipe
{
  success: false,
  message: [
    "email must be an email",
    "name must be longer than or equal to 2 characters"
  ],
  lang: "en",
  timestamp: "..."
}
```

### Custom HttpExceptions

```typescript
// In your service
throw new NotFoundException('User not found');
// Automatically caught and formatted by filter
```

### Translation

The filter automatically translates common validation error messages:

```typescript
'email must be an email' → 'validation.isEmail' (translated)
```

## 🚀 Creating Custom Filters

### Database Exception Filter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    // Handle specific database errors
    if (exception.message.includes('Duplicate entry')) {
      response.status(409).json({
        success: false,
        message: 'Duplicate entry',
      });
    } else {
      response.status(500).json({
        success: false,
        message: 'Database error',
      });
    }
  }
}
```

### All Exceptions Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    response.status(status).json({
      success: false,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

## 🔗 Filter Execution Order

1. **Route Handlers** throw exceptions
2. **Guards** can throw exceptions
3. **Interceptors** can catch and transform
4. **Filters** catch exceptions and format responses

## 🚀 Best Practices

- **Specific Catching**: Use `@Catch()` decorator to catch specific exceptions
- **Error Logging**: Log errors for debugging (especially in production)
- **User-Friendly Messages**: Don't expose internal errors to users
- **Status Codes**: Use appropriate HTTP status codes
- **Translation**: Translate error messages for internationalization
