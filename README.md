# NestJS Backend Starter Kit

This is a production-ready NestJS backend starter kit with authentication, authorization, internationalization, and many other essential features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start development server
npm run start:dev
```

## 📁 Project Structure

```
server/
├── src/              # Source code
│   ├── common/       # Shared utilities, DTOs, entities
│   ├── config/       # Configuration files
│   ├── core/         # Core utilities (guards, decorators, interceptors)
│   ├── i18n/         # Internationalization files
│   ├── modules/      # Feature modules (auth, projects, etc.)
│   ├── seeders/      # Database seeders
│   └── main.ts       # Application entry point
├── test/             # E2E tests
├── uploads/          # Uploaded files (avatars, gallery)
└── README.md         # This file
```

## 🛠️ Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run seed` - Run database seeders
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## 📚 Key Features

- **Authentication** - JWT-based authentication with refresh tokens
- **Authorization** - Role-based access control (RBAC)
- **Internationalization** - Multi-language support (EN/AR)
- **Email Service** - Configurable email sending
- **File Uploads** - Multer-based file upload handling
- **Validation** - Comprehensive DTO validation
- **Error Handling** - Global exception filter
- **Response Formatting** - Unified API response structure
- **Rate Limiting** - Request throttling protection
- **TypeORM** - Database ORM with MySQL

## 🔧 Configuration

All configuration is done through environment variables. See `.env.example` for required variables.

## 📖 Documentation

Each directory contains its own README.md file explaining its purpose and usage. Refer to those files for detailed information about specific components.
