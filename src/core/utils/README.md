# Utils Directory (`utils/`)

This directory contains utility functions and helpers used across the application for common operations.

## 📁 Available Utilities

```
utils/
├── response.ts        # Standardized API response formatting
└── translations.ts    # Internationalization translation helper
```

## 🎯 Purpose

Utilities provide:
- **Code Reusability**: Common functions used in multiple places
- **Consistency**: Standardized helper functions
- **Abstraction**: Hide complex logic behind simple interfaces
- **Maintainability**: Centralized utility code

## 💡 How It Works

### Response Utility (`response.ts`)
Provides standardized response formatting:

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
  lang?: string;
  timestamp: string;
}

export class ResponseUtil {
  static success<T>(
    data?: T,
    message: string = 'Success',
    lang?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      lang,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string,
    error?: string | object,
    lang?: string,
  ): ApiResponse {
    return {
      success: false,
      message,
      error,
      lang,
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Usage**:
```typescript
// In controllers or services
return ResponseUtil.success(users, 'Users retrieved successfully', 'en');
return ResponseUtil.error('User not found', undefined, 'ar');
```

### Translation Utility (`translations.ts`)
Provides translation functionality:

```typescript
export class TranslationUtil {
  static translate(key: string, lang: string = 'en'): string {
    // Loads translation from i18n files
    // Falls back to key if translation not found
  }
}
```

**Usage**:
```typescript
const message = TranslationUtil.translate('validation.isEmail', 'ar');
// Returns Arabic translation
```

## 📝 Creating New Utilities

### Date Utility
```typescript
// utils/date.util.ts
export class DateUtil {
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    // Format date using dayjs or similar
  }

  static isAfter(date: Date, compareDate: Date): boolean {
    return date.getTime() > compareDate.getTime();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
```

### Validation Utility
```typescript
// utils/validation.util.ts
export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    // Phone validation logic
  }
}
```

### File Utility
```typescript
// utils/file.util.ts
import * as fs from 'fs';
import * as path from 'path';

export class FileUtil {
  static async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  static isValidImageExtension(ext: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext.toLowerCase());
  }
}
```

### String Utility
```typescript
// utils/string.util.ts
export class StringUtil {
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
```

## 🚀 Best Practices

- **Pure Functions**: Keep utilities as pure functions when possible
- **No Dependencies**: Minimize dependencies on other modules
- **Type Safety**: Use TypeScript for type safety
- **Error Handling**: Handle edge cases appropriately
- **Documentation**: Add JSDoc comments for complex functions
- **Testing**: Write unit tests for utility functions

