# Enums Directory (`enums/`)

This directory contains TypeScript enumerations that define constant values used throughout the application.

## 🎯 Purpose

Enums provide:
- **Type Safety**: Prevents invalid values at compile time
- **Constants**: Centralized definition of constant values
- **Documentation**: Self-documenting code
- **Refactoring**: Easier to rename and maintain

## 💡 How It Works

### Basic Enum Structure
```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}
```

### Numeric Enums
```typescript
export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  SUSPENDED = 3,
}
```

### String Enums (Recommended)
String enums are preferred as they are more readable and maintainable:
```typescript
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}
```

## 📝 Usage Examples

### In DTOs
```typescript
import { IsEnum } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsEnum(UserRole)
  role: UserRole;
}
```

### In Entities
```typescript
import { Column } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
```

### In Guards/Decorators
```typescript
import { UserRole } from '../enums/user-role.enum';

@Roles(UserRole.ADMIN)
@Get('admin-only')
async adminOnly() {
  // Only accessible to admins
}
```

### In Services
```typescript
if (user.role === UserRole.ADMIN) {
  // Admin logic
}
```

## 🚀 Best Practices

- **String Enums**: Use string enums for better readability and debugging
- **Descriptive Names**: Use clear, descriptive names
- **Group Related**: Group related enums in the same file
- **Export**: Always export enums for reuse
- **Consistency**: Use consistent naming patterns across enums

## 📋 Common Enum Patterns

### Status Enums
```typescript
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}
```

### Permission Enums
```typescript
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
}
```

### Sort Order Enum (already in pagination.dto.ts)
```typescript
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
```

