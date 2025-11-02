# Project Documentation Guide

This document provides an overview of all documentation files in the project. Each directory contains a README.md file explaining its purpose and usage.

## 📚 Documentation Structure

### Root Level
- **[README.md](./README.md)** - Project overview, quick start, and main features

### Source Code (`src/`)
- **[src/README.md](./src/README.md)** - Source directory structure and organization

#### Common (`src/common/`)
- **[common/README.md](./src/common/README.md)** - Shared code overview
- **[common/dtos/README.md](./src/common/dtos/README.md)** - Data Transfer Objects
- **[common/dtos/auth/README.md](./src/common/dtos/auth/README.md)** - Authentication DTOs
- **[common/entities/README.md](./src/common/entities/README.md)** - TypeORM entities
- **[common/enums/README.md](./src/common/enums/README.md)** - TypeScript enumerations
- **[common/interfaces/README.md](./src/common/interfaces/README.md)** - TypeScript interfaces
- **[common/types/README.md](./src/common/types/README.md)** - TypeScript types
- **[common/types/auth/README.md](./src/common/types/auth/README.md)** - Authentication types

#### Configuration (`src/config/`)
- **[config/README.md](./src/config/README.md)** - Configuration files (database, mailer, etc.)

#### Core (`src/core/`)
- **[core/README.md](./src/core/README.md)** - Core infrastructure overview
- **[core/decorators/README.md](./src/core/decorators/README.md)** - Custom decorators
- **[core/guards/README.md](./src/core/guards/README.md)** - Route guards
- **[core/interceptors/README.md](./src/core/interceptors/README.md)** - Response interceptors
- **[core/filters/README.md](./src/core/filters/README.md)** - Exception filters
- **[core/middlewares/README.md](./src/core/middlewares/README.md)** - Express middlewares
- **[core/pipes/README.md](./src/core/pipes/README.md)** - Validation pipes
- **[core/utils/README.md](./src/core/utils/README.md)** - Utility functions

#### Internationalization (`src/i18n/`)
- **[i18n/README.md](./src/i18n/README.md)** - Translation files and multi-language support

#### Modules (`src/modules/`)
- **[modules/README.md](./src/modules/README.md)** - Feature modules overview
- **[modules/auth/README.md](./src/modules/auth/README.md)** - Authentication module
- **[modules/projects/README.md](./src/modules/projects/README.md)** - Projects module

#### Seeders (`src/seeders/`)
- **[seeders/README.md](./src/seeders/README.md)** - Database seeding scripts

### Testing (`test/`)
- **[test/README.md](./test/README.md)** - End-to-end testing guide

### Uploads (`uploads/`)
- **[uploads/README.md](./uploads/README.md)** - File upload handling
- **[uploads/avatars/README.md](./uploads/avatars/README.md)** - Avatar uploads
- **[uploads/gallery/README.md](./uploads/gallery/README.md)** - Gallery image uploads

## 🚀 Quick Navigation

### Getting Started
1. Read [README.md](./README.md) for installation and setup
2. Check [src/README.md](./src/README.md) to understand project structure
3. Review [modules/README.md](./src/modules/README.md) for feature development

### Understanding Architecture
1. **[core/README.md](./src/core/README.md)** - Learn about guards, interceptors, filters
2. **[config/README.md](./src/config/README.md)** - Understand configuration
3. **[common/README.md](./src/common/README.md)** - Explore shared code

### Adding Features
1. **[modules/README.md](./src/modules/README.md)** - How to create new modules
2. **[common/dtos/README.md](./src/common/dtos/README.md)** - Creating DTOs
3. **[common/entities/README.md](./src/common/entities/README.md)** - Creating entities

### Authentication & Authorization
1. **[modules/auth/README.md](./src/modules/auth/README.md)** - Auth module guide
2. **[core/guards/README.md](./src/core/guards/README.md)** - Using guards
3. **[core/decorators/README.md](./src/core/decorators/README.md)** - Using decorators

## 📖 Documentation Standards

Each README.md file follows this structure:
- **Purpose**: What the directory is for
- **How It Works**: Technical explanation
- **Usage Examples**: Code examples
- **Best Practices**: Recommended patterns

## 🔄 Keeping Documentation Updated

When adding new features or directories:
1. Create a README.md in the new directory
2. Update this DOCUMENTATION.md file
3. Follow the existing documentation format
4. Include code examples and usage patterns

## 📝 Contributing

When contributing to documentation:
- Keep examples up-to-date with code changes
- Add code examples for complex concepts
- Document any breaking changes
- Update related documentation files

---

**Last Updated**: This documentation structure is part of the starter kit setup. Update this file when adding new directories or major changes.

