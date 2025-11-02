# Middlewares Directory (`middlewares/`)

This directory contains custom Express middlewares that run before route handlers, providing request preprocessing, logging, and other cross-cutting concerns.

## 🎯 Purpose

Middlewares provide:

- **Request Preprocessing**: Modify requests before they reach handlers
- **Logging**: Log incoming requests
- **Request ID**: Add unique request IDs
- **Rate Limiting**: Additional rate limiting logic
- **Header Manipulation**: Set/remove headers

## 💡 How It Works

### Express Middleware Pattern

Middlewares are functions that have access to:

- `request` object
- `response` object
- `next` function (to call next middleware)

```typescript
export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(`${req.method} ${req.url}`);
  next(); // Continue to next middleware/handler
}
```

### Registration

Register middlewares in `main.ts`:

```typescript
app.use(loggerMiddleware);
```

Or in modules:

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

## 📝 Example Middlewares

### Logger Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url, ip } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      console.log(`${method} ${url} ${statusCode} - ${ip} - ${duration}ms`);
    });

    next();
  }
}
```

### Request ID Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req['id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  }
}
```

### Language Middleware

```typescript
@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const lang = req.headers['accept-language'] || 'en';
    req['lang'] = lang.split(',')[0]; // Get first language
    next();
  }
}
```

### CORS Headers Middleware

```typescript
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    next();
  }
}
```

## 🔗 Middleware vs Interceptors vs Guards

### Use Middlewares For:

- **Request preprocessing** before routing
- **Raw request/response manipulation**
- **Express-specific functionality**
- **Global logging/caching**

### Use Interceptors For:

- **Response transformation**
- **Business logic around handlers**
- **NestJS-specific features**

### Use Guards For:

- **Authentication/Authorization**
- **Route protection**
- **Access control**

## 🚀 Best Practices

- **Injectable**: Use `@Injectable()` for dependency injection
- **Type Safety**: Use TypeScript types for request/response
- **Next()**: Always call `next()` to continue the chain
- **Error Handling**: Handle errors appropriately
- **Performance**: Keep middlewares lightweight
