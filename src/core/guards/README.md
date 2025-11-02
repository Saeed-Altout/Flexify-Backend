# Guards Directory (`guards/`)

This directory contains route guards that control access to endpoints based on authentication, roles, and permissions.

## 📁 Available Guards

```
guards/
├── jwt-auth.guard.ts        # JWT authentication guard
├── roles.guard.ts           # Role-based access control guard
└── permissions.guard.ts     # Permission-based access control guard
```

## 🎯 Purpose

Guards provide:
- **Authentication**: Verify user identity
- **Authorization**: Control access based on roles/permissions
- **Route Protection**: Secure endpoints automatically
- **User Context**: Attach user information to requests

## 💡 How It Works

### JWT Auth Guard (`jwt-auth.guard.ts`)
Validates JWT tokens and attaches user to request:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Checks @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

**How it works**:
1. Extends Passport's `AuthGuard('jwt')`
2. Checks for `@Public()` decorator (bypasses auth if present)
3. Validates JWT token from `Authorization` header
4. Attaches user payload to `request.user`

**Usage**:
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)  // All routes in controller are protected
export class UsersController {
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;  // User is available here
  }
}
```

### Roles Guard (`roles.guard.ts`)
Restricts access based on user roles:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;  // No roles required
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Usage**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
async adminOnly() {
  // Only admins can access
}
```

**How it works**:
1. Reads `@Roles()` decorator metadata
2. Checks if user has at least one required role
3. Returns `true` to allow access, `false` to deny

### Permissions Guard (`permissions.guard.ts`)
Restricts access based on specific permissions:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    
    if (!requiredPermissions) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.every((permission) =>
      user.permissions?.includes(permission),
    );
  }
}
```

**Usage**:
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('read:users', 'write:users')
@Post('users')
async createUser() {
  // Requires both permissions
}
```

## 📝 Guard Execution Order

Guards execute in the order they're specified:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
// 1. JwtAuthGuard - Authenticates user
// 2. RolesGuard - Checks roles
// 3. PermissionsGuard - Checks permissions
```

## 🚀 Creating Custom Guards

### Example: IP Whitelist Guard
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private whitelist = ['127.0.0.1', '192.168.1.1'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    return this.whitelist.includes(ip);
  }
}
```

## 🚀 Best Practices

- **Order Matters**: Place JwtAuthGuard first (needs user context)
- **Composability**: Guards can be combined for complex rules
- **Error Handling**: Throw appropriate exceptions (UnauthorizedException, ForbiddenException)
- **Reusability**: Make guards generic and reusable
- **Testing**: Write unit tests for guard logic

