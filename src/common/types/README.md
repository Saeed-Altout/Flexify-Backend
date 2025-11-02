# Types Directory (`types/`)

This directory contains TypeScript type definitions, type aliases, and utility types used throughout the application.

## 📁 Structure

```
types/
├── auth/              # Authentication-related types
│   ├── jwt-payload.type.ts
│   └── ...
└── [module-name].types.ts  # Module-specific types
```

## 🎯 Purpose

Types provide:

- **Type Aliases**: Named type definitions for reusability
- **Utility Types**: Type transformations and helpers
- **Union Types**: Multiple possible types
- **Intersection Types**: Combining multiple types
- **Complex Types**: Advanced type operations

## 💡 How It Works

### Type Aliases

```typescript
export type ID = string | number;

export type Status = 'active' | 'inactive' | 'pending';
```

### Utility Types

```typescript
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

### Union Types

```typescript
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### Intersection Types

```typescript
export type UserWithRole = User & { role: Role };
```

## 📝 Usage Examples

### In Function Signatures

```typescript
import { ID } from '../common/types/id.type';

function findById(id: ID): User {
  // Works with both string and number IDs
}
```

### In Generic Functions

```typescript
import { Result } from '../common/types/result.type';

async function fetchUser(id: number): Promise<Result<User>> {
  try {
    const user = await this.userRepository.findOne(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error };
  }
}
```

### Utility Types

```typescript
// Make all properties optional
type PartialUser = Partial<User>;

// Omit specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Pick specific properties
type UserPublicInfo = Pick<User, 'id' | 'name' | 'email'>;
```

## 🔄 Types vs Interfaces

### Use Types When:

- Creating type aliases for primitives/unions
- Complex type operations (utility types)
- Tuple types
- Mapped types

### Use Interfaces When:

- Defining object shapes
- Extending/merging contracts
- Public API definitions

## 🚀 Best Practices

- **Descriptive Names**: Use clear, descriptive names
- **Group Related**: Group related types together
- **Reusability**: Create types for commonly used patterns
- **Documentation**: Add comments for complex types
- **Generic Types**: Use generics for reusable type utilities
