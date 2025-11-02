# Decorators Directory (`decorators/`)

This directory contains custom decorators that add metadata to routes, controllers, and handlers.

## 📁 Available Decorators

```
decorators/
├── public.decorator.ts         # Marks routes as public (no auth required)
├── roles.decorator.ts          # Restricts access by roles
├── permissions.decorator.ts    # Restricts access by permissions
└── current-lang.decorator.ts   # Extracts current language from request
```

## 🎯 Purpose

Decorators provide:

- **Metadata**: Add information to routes for guards/interceptors
- **Clean Code**: Declarative way to configure routes
- **Reusability**: Common patterns extracted into decorators
- **Type Safety**: TypeScript decorators with full type support

## 💡 How It Works

### Public Decorator (`public.decorator.ts`)

Marks routes as publicly accessible (bypasses authentication):

```typescript
export const Public = () => SetMetadata('isPublic', true);
```

**Usage**:

```typescript
@Controller('auth')
export class AuthController {
  @Public() // No JWT required
  @Post('login')
  async login() {
    // Public endpoint
  }
}
```

**How it works**: The `JwtAuthGuard` checks for this metadata and allows access if `isPublic` is true.

### Roles Decorator (`roles.decorator.ts`)

Restricts access to specific roles:

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Usage**:

```typescript
@Roles('admin', 'moderator')
@Get('admin-data')
async getAdminData() {
  // Only admins and moderators can access
}
```

**How it works**: The `RolesGuard` reads this metadata and checks user roles.

### Permissions Decorator (`permissions.decorator.ts`)

Restricts access based on specific permissions:

```typescript
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

**Usage**:

```typescript
@Permissions('read:users', 'write:users')
@Get('users')
async getUsers() {
  // Requires both permissions
}
```

**How it works**: The `PermissionsGuard` checks if user has all required permissions.

### Current Language Decorator (`current-lang.decorator.ts`)

Extracts language from request headers:

```typescript
export const CurrentLang = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['accept-language'] || 'en';
  },
);
```

**Usage**:

```typescript
@Get('translated')
async getTranslated(@CurrentLang() lang: string) {
  // lang is automatically extracted from Accept-Language header
  return this.service.getTranslatedData(lang);
}
```

## 📝 Creating Custom Decorators

### Simple Metadata Decorator

```typescript
import { SetMetadata } from '@nestjs/common';

export const FeatureFlag = (flag: string) => SetMetadata('featureFlag', flag);
```

### Parameter Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Set by JwtAuthGuard
  },
);
```

**Usage**:

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

## 🚀 Best Practices

- **Single Purpose**: Each decorator should do one thing
- **Type Safety**: Use TypeScript types for parameters
- **Documentation**: Add JSDoc comments explaining usage
- **Naming**: Use descriptive, action-oriented names
- **Reusability**: Design decorators to be reusable across modules
