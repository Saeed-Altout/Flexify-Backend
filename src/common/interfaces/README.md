# Interfaces Directory (`interfaces/`)

This directory contains TypeScript interfaces that define contracts and type structures used across the application.

## 🎯 Purpose

Interfaces provide:
- **Type Contracts**: Define shape of objects and data structures
- **API Contracts**: Document expected request/response formats
- **Type Safety**: Compile-time type checking
- **Code Documentation**: Self-documenting code structure

## 💡 How It Works

### Basic Interface Structure
```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}
```

### Optional Properties
```typescript
export interface CreateUserRequest {
  name: string;
  email: string;
  role?: string; // Optional property
}
```

### Generic Interfaces
```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}
```

### Extending Interfaces
```typescript
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
}
```

## 📝 Usage Examples

### In Services
```typescript
import { User } from '../common/interfaces/user.interface';

@Injectable()
export class UsersService {
  async create(userData: CreateUserRequest): Promise<User> {
    // Implementation
  }
}
```

### In DTOs/Responses
```typescript
import { PaginatedResponse } from '../common/interfaces/pagination.interface';

export interface GetUsersResponse extends PaginatedResponse<User> {
  // Additional properties
}
```

### As Return Types
```typescript
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchData(): Promise<ServiceResult<User>> {
  // Implementation
}
```

## 🔄 Interfaces vs Types vs Classes

### When to Use Interfaces
- **Object Shapes**: Defining structure of objects
- **API Contracts**: Request/response structures
- **Type Merging**: Can be extended and merged
- **Public APIs**: Exposing public contracts

### When to Use Types
- **Unions/Intersections**: Complex type operations
- **Primitive Aliases**: `type ID = string | number`
- **Tuple Types**: Fixed-length arrays

### When to Use Classes
- **Instances**: When you need to instantiate
- **Methods**: When you need behavior/logic
- **Validation**: When used with class-validator

## 🚀 Best Practices

- **Descriptive Names**: Use clear, descriptive names (often end with `Interface` or descriptive noun)
- **Export**: Always export interfaces for reuse
- **Documentation**: Add JSDoc comments for complex interfaces
- **Group Related**: Group related interfaces in the same file
- **Prefer Interfaces**: Use interfaces for object shapes, types for unions/intersections

