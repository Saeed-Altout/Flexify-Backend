# Source Directory (`src/`)

This directory contains all the source code for the NestJS application.

## 📁 Directory Structure

```
src/
├── common/          # Shared utilities, DTOs, entities, enums, interfaces
├── config/          # Configuration modules (database, mailer, multer, validation)
├── core/            # Core application infrastructure (guards, decorators, filters, interceptors)
├── i18n/            # Internationalization translation files
├── modules/         # Feature modules (business logic modules)
├── seeders/         # Database seeding scripts
├── app.module.ts    # Root application module
├── app.controller.ts # Root controller
├── app.service.ts   # Root service
└── main.ts          # Application entry point
```

## 🎯 How It Works

### Entry Point (`main.ts`)

The application starts from `main.ts`, which:

- Creates the NestJS application instance
- Configures CORS, static file serving, and global pipes
- Sets up the API prefix (`/api`)
- Starts the HTTP server

### Application Module (`app.module.ts`)

The root module that:

- Imports all feature modules
- Configures global modules (Config, TypeORM, Throttler)
- Sets up global interceptors and filters
- Defines the application structure

### Module Organization

- **Common**: Reusable code shared across modules
- **Config**: Environment and service configurations
- **Core**: Application-wide infrastructure components
- **Modules**: Feature-specific business logic
- **Seeders**: Database initialization scripts
- **i18n**: Translation files for multi-language support

## 🚀 Getting Started

1. **Adding a New Module**: Create a folder in `modules/` with the module structure
2. **Using Shared Code**: Import from `common/` directory
3. **Adding Core Features**: Extend `core/` with new guards, decorators, etc.
4. **Configuration**: Add new config files in `config/` directory

## 📝 Best Practices

- Keep modules focused on a single feature
- Use DTOs from `common/dtos/` for data validation
- Leverage core utilities for common functionality
- Follow NestJS module structure conventions
