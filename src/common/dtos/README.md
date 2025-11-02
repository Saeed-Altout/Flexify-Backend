# DTOs Directory (`dtos/`)

This directory contains Data Transfer Objects (DTOs) used for validating and transferring data between layers of the application.

## 📁 Structure

```
dtos/
├── auth/              # Authentication-related DTOs
│   ├── login.dto.ts   # Login request DTO
│   ├── register.dto.ts # Registration DTO
│   └── ...
├── pagination.dto.ts  # Base pagination DTO with utilities
└── [module-name].dto.ts  # Module-specific DTOs
```

## 🎯 Purpose

DTOs serve multiple purposes:

1. **Validation**: Define validation rules using `class-validator`
2. **Type Safety**: Ensure type correctness at compile time
3. **Documentation**: Self-documenting API contracts
4. **Transformation**: Transform incoming data using `class-transformer`

## 💡 How It Works

### Base Pagination DTO

The `pagination.dto.ts` file provides a reusable pagination structure:

```typescript
export class BasePaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
```

### Usage in Controllers

```typescript
@Get()
async findAll(@Query() dto: BasePaginationDto) {
  // dto.page, dto.limit automatically validated
  return this.service.findAll(dto);
}
```

### Extending Pagination DTO

```typescript
export class GetUsersDto extends BasePaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
```

## 📝 Creating New DTOs

### Step 1: Create DTO File

```typescript
// users/create-user.dto.ts
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Step 2: Use in Controller

```typescript
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

### Step 3: Validation Happens Automatically

Thanks to the global `ValidationPipe` in `main.ts`, all DTOs are automatically validated.

## 🚀 Best Practices

- **Use Decorators**: Always use `class-validator` decorators
- **Type Transformation**: Use `@Type()` for number/date conversions
- **Extend Base DTOs**: Reuse common patterns like pagination
- **Group by Feature**: Create subdirectories for related DTOs
- **Document Complex Rules**: Add comments for complex validations
