# Interceptors Directory (`interceptors/`)

This directory contains interceptors that transform requests and responses, handle logging, and modify data flow.

## 📁 Available Interceptors

```
interceptors/
└── response.interceptor.ts   # Formats all API responses uniformly
```

## 🎯 Purpose

Interceptors provide:
- **Response Transformation**: Standardize API response format
- **Request Transformation**: Modify incoming requests
- **Logging**: Log requests/responses
- **Caching**: Add caching logic
- **Error Handling**: Transform errors before they reach filters

## 💡 How It Works

### Response Interceptor (`response.interceptor.ts`)
Formats all API responses into a consistent structure:

```typescript
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const lang = request.headers['accept-language'] || 'en';

    return next.handle().pipe(
      map((data) => {
        // If response already has success property, just add lang
        if (data && typeof data === 'object' && 'success' in data) {
          return { ...data, lang };
        }
        // Otherwise, wrap in standard response format
        return ResponseUtil.success(data, 'Success', lang);
      }),
    );
  }
}
```

**Response Format**:
```typescript
{
  success: true,
  message: "Success",
  data: { ... },  // Your actual data
  lang: "en",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

**Registered Globally** in `app.module.ts`:
```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: ResponseInterceptor,
}
```

## 📝 Usage Examples

### Controller Returns Data
```typescript
@Get('users')
async getUsers() {
  return [{ id: 1, name: 'John' }];
  // Automatically formatted as:
  // {
  //   success: true,
  //   message: "Success",
  //   data: [{ id: 1, name: 'John' }],
  //   lang: "en",
  //   timestamp: "..."
  // }
}
```

### Manual Response Format
```typescript
@Get('custom')
async getCustom() {
  return ResponseUtil.success(data, 'Custom message', 'ar');
  // Interceptor preserves your format and just adds lang if missing
}
```

## 🚀 Creating Custom Interceptors

### Logging Interceptor
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const delay = Date.now() - now;
        this.logger.log(`${method} ${url} ${statusCode} - ${delay}ms`);
      }),
    );
  }
}
```

### Caching Interceptor
```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cachedResponse = this.cache.get(request.url);
    
    if (cachedResponse) {
      return of(cachedResponse);
    }
    
    return next.handle().pipe(
      tap((response) => {
        this.cache.set(request.url, response);
      }),
    );
  }
}
```

### Timeout Interceptor
```typescript
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException('Request timeout');
        }
        throw err;
      }),
    );
  }
}
```

## 🔗 Interceptor Chain

Interceptors execute in this order:
1. **Global Interceptors** (from `app.module.ts`)
2. **Controller-Level** (from `@UseInterceptors()`)
3. **Route-Level** (from `@UseInterceptors()`)

## 🚀 Best Practices

- **Side Effects**: Use `tap()` for side effects (logging, caching)
- **Transformation**: Use `map()` for data transformation
- **Error Handling**: Use `catchError()` for error transformation
- **Async Operations**: Can return Observables or Promises
- **Reusability**: Keep interceptors generic and configurable

