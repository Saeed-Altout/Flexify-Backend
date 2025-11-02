# Projects Module (`modules/projects/`)

This module handles project management functionality.

## 📁 Typical Structure

```
projects/
├── projects.module.ts         # Module definition
├── projects.controller.ts     # Project endpoints
├── projects.service.ts        # Project business logic
├── entities/
│   └── project.entity.ts      # Project database entity
├── dtos/
│   ├── create-project.dto.ts
│   ├── update-project.dto.ts
│   └── get-projects.dto.ts
└── interfaces/
    └── project.interface.ts   # Project type definitions
```

## 🎯 Features

This module typically provides:
- **CRUD Operations**: Create, read, update, delete projects
- **Project Listing**: Paginated project list with filters
- **Project Details**: Get detailed project information
- **Project Status**: Manage project status (active, completed, etc.)
- **Project Members**: Assign team members to projects (if applicable)

## 💡 Module Structure

### Projects Module
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

### Projects Controller
```typescript
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Permissions('create:projects')
  async create(@Body() createDto: CreateProjectDto) {}

  @Get()
  async findAll(@Query() query: GetProjectsDto) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {}

  @Patch(':id')
  @Permissions('update:projects')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProjectDto,
  ) {}

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {}
}
```

### Projects Service
```typescript
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createDto);
    return this.projectRepository.save(project);
  }

  async findAll(query: GetProjectsDto): Promise<PaginatedResponse<Project>> {
    // Implement pagination and filtering
  }

  async findOne(id: number): Promise<Project> {
    return this.projectRepository.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateProjectDto): Promise<Project> {
    await this.projectRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.projectRepository.delete(id);
  }
}
```

## 📝 Endpoints

Typical project endpoints:
- `GET /api/projects` - Get paginated list of projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## 🔗 Relationships

Projects may have relationships with:
- **Users**: Project owners, members, assignees
- **Tasks**: Tasks belonging to projects
- **Categories**: Project categories/tags
- **Files**: Project-related files and documents

## 🚀 Best Practices

- **Authorization**: Use guards and decorators for access control
- **Validation**: Validate all inputs with DTOs
- **Error Handling**: Return appropriate error messages
- **Pagination**: Implement pagination for list endpoints
- **Filtering**: Support filtering and search
- **Soft Delete**: Consider soft deletes instead of hard deletes

