# Common Directory (`common/`)

This directory contains shared code that is used across multiple modules in the application.

## 📁 Directory Structure

```
common/
├── dtos/            # Data Transfer Objects (DTOs) for validation
│   ├── auth/       # Authentication-related DTOs
│   └── pagination.dto.ts  # Pagination DTO
├── entities/        # TypeORM entities (database models)
├── enums/           # Shared enumerations
├── interfaces/      # TypeScript interfaces
└── types/           # TypeScript types
    └── auth/        # Authentication-related types
```

## 🎯 Purpose

The `common/` directory serves as a shared library for:

- **DTOs**: Validation schemas for request/response data
- **Entities**: Database model definitions
- **Enums**: Shared constants and enumerations
- **Interfaces**: TypeScript type definitions
- **Types**: TypeScript type aliases and utility types

## 💡 How It Works

### DTOs (Data Transfer Objects)

DTOs define the structure and validation rules for data:

```typescript
// Example: Using pagination DTO
export class BasePaginationDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  sortOrder?: SortOrder = SortOrder.DESC;
}
```

### Entities

TypeORM entities represent database tables:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

### Enums

Shared enumerations for constants:

```typescript
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
```

### Interfaces & Types

TypeScript definitions for type safety:

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

## 📝 Usage Examples

### Using DTOs in Controllers

```typescript
@Post()
async create(@Body() dto: CreateUserDto) {
  // DTO automatically validates input
}
```

### Using Entities in Services

```typescript
constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>,
) {}
```

### Extending Common Types

Create module-specific DTOs that extend base DTOs:

```typescript
export class GetUsersDto extends BasePaginationDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

## 🚀 Best Practices

- **Reusability**: Put code here if it's used by 2+ modules
- **Validation**: Always use DTOs with class-validator decorators
- **Type Safety**: Use TypeScript interfaces and types
- **Organization**: Group related DTOs/types in subdirectories
