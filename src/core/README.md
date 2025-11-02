# Core Directory (`core/`)

This directory contains core application infrastructure components that provide cross-cutting concerns like authentication, authorization, error handling, and response formatting.

## 📁 Structure

```
core/
├── decorators/       # Custom decorators (Public, Roles, Permissions, etc.)
├── guards/           # Route guards (JWT, Roles, Permissions)
├── interceptors/     # Response interceptors
├── filters/           # Exception filters
├── middlewares/      # Custom middlewares
├── pipes/             # Custom validation/transformation pipes
└── utils/             # Utility functions (response, translations)
```

## 🎯 Purpose

The `core/` directory provides:
- **Cross-Cutting Concerns**: Functionality used across all modules
- **Application Infrastructure**: Guards, filters, interceptors
- **Reusable Utilities**: Common helper functions
- **Decorators**: Custom metadata decorators for controllers

## 💡 How Components Work

### Decorators
Provide metadata to routes and handlers:
```typescript
@Public()  // Makes route accessible without authentication
@Roles('admin')  // Restricts access to specific roles
@Permissions('read:users')  // Checks specific permissions
```

### Guards
Protect routes and validate access:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Get()
async getData() {
  // Route is protected
}
```

### Interceptors
Transform responses before sending to client:
```typescript
// Automatically formats all responses
{
  success: true,
  message: "Success",
  data: {...}
}
```

### Filters
Catch and handle exceptions globally:
```typescript
// Automatically catches HttpExceptions
// Formats error responses
// Translates error messages
```

## 📝 Usage Examples

### Using Decorators
```typescript
@Controller('users')
export class UsersController {
  @Public()  // No auth required
  @Get('public')
  getPublicData() {}

  @Roles('admin')  // Admin only
  @Get('admin')
  getAdminData() {}
}
```

### Using Guards
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async getProtectedData() {
  // User is authenticated
}
```

### Custom Interceptors
```typescript
@UseInterceptors(LoggingInterceptor)
@Get()
async getData() {
  // Interceptor logs the request
}
```

## 🔗 Global Configuration

Some components are registered globally in `app.module.ts`:
```typescript
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
]
```

## 🚀 Best Practices

- **Reusability**: Keep core components generic and reusable
- **Single Responsibility**: Each component should do one thing well
- **Documentation**: Document custom decorators and guards
- **Testing**: Write tests for core components
- **Global vs Local**: Use global registration for universal needs

