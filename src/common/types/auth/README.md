# Auth Types Directory (`types/auth/`)

This directory contains TypeScript type definitions specific to authentication and authorization.

## 🎯 Purpose

This directory holds types for:
- **JWT Payload**: Structure of JWT token payload
- **User Context**: Authenticated user information
- **Token Types**: Access token and refresh token types
- **Auth Response**: Authentication response structures

## 💡 Typical Types

### JWT Payload Type
```typescript
// jwt-payload.type.ts
export interface JwtPayload {
  sub: number;           // User ID
  email: string;
  role: string;
  permissions?: string[];
  iat?: number;          // Issued at
  exp?: number;          // Expiration
}
```

### Auth Response Type
```typescript
// auth-response.type.ts
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
```

### User Context Type
```typescript
// user-context.type.ts
export interface RequestUser {
  id: number;
  email: string;
  role: string;
  permissions: string[];
}
```

## 📝 Usage

Use these types in services and guards:
```typescript
// In JWT Strategy
async validate(payload: JwtPayload): Promise<RequestUser> {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions || [],
  };
}

// In controller
@Get('profile')
async getProfile(@CurrentUser() user: RequestUser) {
  return user;
}
```

## 🚀 Best Practices

- **Type Safety**: Use interfaces for object shapes
- **Consistency**: Keep types aligned with entities
- **Documentation**: Document complex types
- **Extensibility**: Design types to be extendable

