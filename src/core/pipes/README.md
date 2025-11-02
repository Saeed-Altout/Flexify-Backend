# Pipes Directory (`pipes/`)

This directory contains custom pipes for data validation and transformation before it reaches route handlers.

## 🎯 Purpose

Pipes provide:
- **Validation**: Validate input data before processing
- **Transformation**: Transform data types and formats
- **Parsing**: Parse and convert data types
- **Data Sanitization**: Clean and sanitize input data

## 💡 How It Works

### Built-in Pipes
NestJS provides built-in pipes (configured globally in `main.ts`):
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error for non-whitelisted
    transform: true,            // Auto-transform types
  }),
);
```

### Pipe Execution Order
1. **Global Pipes** (from `main.ts`)
2. **Route-Level Pipes** (from `@UsePipes()`)
3. **Parameter-Level Pipes** (from `@Param()`, `@Query()`, `@Body()`)

## 📝 Example Custom Pipes

### Parse Int Pipe
```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed: value must be a number');
    }
    return val;
  }
}
```

**Usage**:
```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  // id is automatically converted to number
}
```

### Parse Boolean Pipe
```typescript
@Injectable()
export class ParseBooleanPipe implements PipeTransform<string, boolean> {
  transform(value: string): boolean {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException('Value must be true or false');
  }
}
```

### Parse Array Pipe
```typescript
@Injectable()
export class ParseArrayPipe implements PipeTransform<string, string[]> {
  transform(value: string): string[] {
    if (!value) return [];
    return value.split(',').map(item => item.trim());
  }
}
```

**Usage**:
```typescript
@Get('tags')
async findByTags(@Query('tags', ParseArrayPipe) tags: string[]) {
  // ?tags=tech,programming → ['tech', 'programming']
}
```

### UUID Validation Pipe
```typescript
import { isUUID } from 'class-validator';

@Injectable()
export class UUIDValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!isUUID(value)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return value;
  }
}
```

### Date Transformation Pipe
```typescript
@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return date;
  }
}
```

## 🔗 Pipes vs DTOs

### Use Pipes For:
- **Type Conversion**: String to number, date, etc.
- **Simple Validation**: Format validation (UUID, email format)
- **Query Parameter Parsing**: Parse arrays, booleans from query strings

### Use DTOs For:
- **Complex Validation**: Multiple field validation
- **Business Logic Validation**: Complex rules
- **Request Body Validation**: Full object validation

## 🚀 Best Practices

- **Reusability**: Make pipes generic and reusable
- **Error Messages**: Provide clear, helpful error messages
- **Type Safety**: Use TypeScript generics for type safety
- **Performance**: Keep pipes lightweight and fast
- **Documentation**: Document what the pipe does

