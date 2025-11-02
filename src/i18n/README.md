# i18n Directory (`i18n/`)

This directory contains internationalization (i18n) translation files for multiple languages.

## 📁 Structure

```
i18n/
├── en.json    # English translations
├── ar.json    # Arabic translations
└── [lang].json  # Additional language files
```

## 🎯 Purpose

The i18n directory provides:
- **Multi-Language Support**: Translations for different languages
- **Centralized Translations**: All translations in one place
- **Easy Maintenance**: Update translations without code changes
- **Consistent Messages**: Standardized error and success messages

## 💡 How It Works

### Translation File Structure
```json
// en.json
{
  "validation": {
    "isEmail": "Email must be a valid email address",
    "isPhoneNumber": "Phone must be a valid phone number",
    "minLength": "Must be at least {min} characters",
    "maxLength": "Must not exceed {max} characters"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred"
  }
}
```

```json
// ar.json
{
  "validation": {
    "isEmail": "يجب أن يكون البريد الإلكتروني عنوان بريد إلكتروني صالح",
    "isPhoneNumber": "يجب أن يكون الهاتف رقم هاتف صالح",
    "minLength": "يجب أن يكون على الأقل {min} أحرف",
    "maxLength": "يجب ألا يتجاوز {max} حرف"
  },
  "messages": {
    "success": "اكتملت العملية بنجاح",
    "error": "حدث خطأ"
  }
}
```

### Language Detection
The application detects language from the `Accept-Language` header:
```
Accept-Language: ar,en;q=0.9
```

### Using Translations
Translations are used in:
1. **Exception Filter**: Translates validation errors
2. **Response Interceptor**: Adds language to responses
3. **Translation Utility**: Manual translation via `TranslationUtil`

## 📝 Adding New Translations

### Step 1: Add to All Language Files
```json
// en.json
{
  "users": {
    "notFound": "User not found",
    "created": "User created successfully"
  }
}

// ar.json
{
  "users": {
    "notFound": "المستخدم غير موجود",
    "created": "تم إنشاء المستخدم بنجاح"
  }
}
```

### Step 2: Use in Code
```typescript
import { TranslationUtil } from '../core/utils/translations';

const message = TranslationUtil.translate('users.notFound', 'ar');
```

## 🌍 Supported Languages

Currently supported:
- **English (en)**: Default language
- **Arabic (ar)**: RTL support

To add more languages:
1. Create a new `[lang].json` file
2. Copy structure from `en.json`
3. Translate all strings
4. Update language detection logic if needed

## 📝 Translation Key Structure

Use dot notation for nested keys:
```json
{
  "module": {
    "action": {
      "result": "Translation"
    }
  }
}
```

Access via: `"module.action.result"`

## 🚀 Best Practices

- **Consistency**: Keep same structure across all language files
- **Placeholders**: Use `{variable}` for dynamic values
- **Naming**: Use descriptive, hierarchical keys
- **Fallback**: Always have English as fallback
- **RTL Support**: Consider RTL languages (Arabic) in UI
- **Review**: Have native speakers review translations

