# Projects Module

A comprehensive projects service for managing technical portfolio projects with multi-language support, ratings, and likes.

## Features

- ✅ Full CRUD operations for projects
- ✅ Multi-language support (English & Arabic) via translations table
- ✅ Rating system (1-5 stars)
- ✅ Like/Unlike functionality
- ✅ Type-safe implementation
- ✅ SOLID principles architecture
- ✅ Supabase integration

## Database Schema

The module uses the following tables:
- `projects` - Main project data
- `project_translations` - Multi-language content (en/ar)
- `project_ratings` - User ratings (1-5)
- `project_likes` - User likes

See `server/sql/projects_setup.sql` for the complete schema.

## Architecture

### Backend Structure

```
projects/
├── types/                    # TypeScript interfaces
│   ├── project.type.ts
│   ├── project-translation.type.ts
│   ├── project-rating.type.ts
│   ├── project-like.type.ts
│   └── project-with-relations.type.ts
├── repositories/            # Data access layer (Single Responsibility)
│   └── projects.repository.ts
├── dtos/                    # Data Transfer Objects with validation
│   ├── create-project.dto.ts
│   ├── update-project.dto.ts
│   ├── query-projects.dto.ts
│   └── rate-project.dto.ts
├── projects.service.ts      # Business logic layer
├── projects.controller.ts  # HTTP endpoints
└── projects.module.ts       # NestJS module
```

### SOLID Principles Applied

1. **Single Responsibility**: 
   - Repository handles only data access
   - Service handles only business logic
   - Controller handles only HTTP concerns

2. **Open/Closed**: 
   - Interfaces allow extension without modification
   - DTOs can be extended via PartialType

3. **Liskov Substitution**: 
   - Repository can be swapped with different implementations

4. **Interface Segregation**: 
   - Separate interfaces for different concerns (IProjectsRepository, IProjectsInteractions)

5. **Dependency Inversion**: 
   - Service depends on repository interface, not concrete implementation
   - Frontend service depends on API interface

## API Endpoints

### Projects CRUD

- `POST /projects` - Create project (authenticated)
- `GET /projects` - List projects (public/published, authenticated/all)
- `GET /projects/:id` - Get project by ID
- `PATCH /projects/:id` - Update project (owner only)
- `DELETE /projects/:id` - Delete project (owner only, soft delete)

### Interactions

- `POST /projects/:id/rate` - Rate project (1-5, authenticated)
- `POST /projects/:id/like` - Toggle like (authenticated)

## Usage Examples

### Create Project

```typescript
const project = await projectsService.create(userId, {
  tech_stack: ['React', 'TypeScript', 'Next.js'],
  role: 'Full Stack Developer',
  github_url: 'https://github.com/user/project',
  live_demo_url: 'https://project-demo.com',
  is_published: true,
  translations: [
    {
      language: 'en',
      title: 'My Awesome Project',
      summary: 'A great project',
      description: 'Full description...',
      features: ['Feature 1', 'Feature 2']
    },
    {
      language: 'ar',
      title: 'مشروعي الرائع',
      summary: 'مشروع رائع',
      description: 'وصف كامل...',
      features: ['ميزة 1', 'ميزة 2']
    }
  ]
});
```

### Query Projects

```typescript
const result = await projectsService.findAll({
  search: 'React',
  tech_stack: 'TypeScript',
  is_published: true,
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  order: 'DESC'
});
```

## Frontend Integration

The frontend follows the same SOLID principles:

- **Interfaces**: `interfaces/projects-api.interface.ts`
- **API Service**: `services/projects-api.service.ts` (implements interface)
- **Business Service**: `services/projects.service.ts` (uses API service)
- **Provider**: `providers/projects-service.provider.tsx` (Dependency Injection)

### Using the Service

```typescript
import { useProjectsService } from '@/modules/projects/providers/projects-service.provider';

function MyComponent() {
  const projectsService = useProjectsService();
  
  const handleCreate = async () => {
    const project = await projectsService.createProject({
      // ... project data
    });
  };
}
```

## Database Setup

1. Run the SQL script in Supabase SQL Editor:
   ```sql
   -- See server/sql/projects_setup.sql
   ```

2. The script creates:
   - All necessary tables
   - Indexes for performance
   - Triggers for automatic stats updates
   - RLS policies for security

## Translation Support

Each project must have translations for both `en` and `ar` languages. The system validates this requirement on create/update.

## Rating & Likes

- **Ratings**: Users can rate projects 1-5. Average rating and total count are automatically calculated via database triggers.
- **Likes**: Users can like/unlike projects. Total likes count is automatically updated via database triggers.

## Security

- Projects are protected by Row Level Security (RLS)
- Users can only modify their own projects
- Published projects are visible to everyone
- Unpublished projects are only visible to the owner
- Service role has full access for backend operations

