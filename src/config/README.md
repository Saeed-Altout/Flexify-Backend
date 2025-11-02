# Config Directory (`config/`)

This directory contains configuration files for various services and modules in the application.

## 📁 Structure

```
config/
├── env.validation.ts    # Environment variable validation schema
├── typeorm.config.ts    # TypeORM database configuration
├── mailer.config.ts     # Email service configuration
└── multer.config.ts     # File upload configuration
```

## 🎯 Purpose

Configuration files centralize:
- **Environment Validation**: Type-safe environment variables
- **Service Configuration**: Database, email, file upload settings
- **Type Safety**: TypeScript types for configuration
- **Validation**: Runtime validation of configuration values

## 💡 How It Works

### Environment Validation (`env.validation.ts`)
Validates and types all environment variables:

```typescript
export class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: string;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @IsString()
  DB_HOST: string;
  // ... more variables
}
```

**Usage in app.module.ts**:
```typescript
ConfigModule.forRoot({
  validate: (config) => {
    const validatedConfig = new EnvironmentVariables();
    Object.assign(validatedConfig, config);
    return validatedConfig;
  },
})
```

### TypeORM Configuration (`typeorm.config.ts`)
Used for database migrations and CLI operations:

```typescript
export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  // ... database configuration
});
```

**Usage**:
```bash
npm run migration:generate
npm run migration:run
```

### Mailer Configuration (`mailer.config.ts`)
Configures email service (if exists):

```typescript
export const mailerConfig = {
  transport: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  },
};
```

### Multer Configuration (`multer.config.ts`)
Configures file upload handling:

```typescript
export const multerConfig = {
  dest: './uploads',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
```

## 📝 Adding New Configuration

### Step 1: Add to Environment Variables
```typescript
// env.validation.ts
@IsString()
NEW_SERVICE_API_KEY: string;
```

### Step 2: Create Configuration File
```typescript
// config/new-service.config.ts
export const newServiceConfig = {
  apiKey: process.env.NEW_SERVICE_API_KEY,
  endpoint: process.env.NEW_SERVICE_ENDPOINT,
};
```

### Step 3: Use in Module
```typescript
import { newServiceConfig } from '../config/new-service.config';

@Module({
  providers: [
    {
      provide: 'NEW_SERVICE_CONFIG',
      useValue: newServiceConfig,
    },
  ],
})
```

## 🚀 Best Practices

- **Validation**: Always validate environment variables
- **Type Safety**: Use TypeScript types for all configs
- **Default Values**: Provide sensible defaults where possible
- **Documentation**: Document required environment variables
- **Security**: Never commit sensitive configs to version control

