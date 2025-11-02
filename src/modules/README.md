# Modules Directory (`modules/`)

This directory contains feature modules that implement business logic for different parts of the application.

## 📁 Structure

```
modules/
├── auth/           # Authentication module (login, register, JWT)
├── projects/       # Projects module (CRUD operations)
└── [feature]/      # Additional feature modules
```

## 🎯 Purpose

Modules follow NestJS's modular architecture:
- **Separation of Concerns**: Each module handles one feature
- **Encapsulation**: Module-specific code is contained
- **Reusability**: Modules can be imported where needed
- **Scalability**: Easy to add new features

## 💡 Module Structure

Each module typically contains:

```
auth/
├── auth.module.ts      # Module definition (imports/exports)
├── auth.controller.ts # HTTP endpoints
├── auth.service.ts    # Business logic
├── auth.dto.ts        # Data Transfer Objects
├── auth.entity.ts     # Database entity (if in module)
└── strategies/        # Auth strategies (JWT, Local, etc.)
```

### Example Module Structure
```typescript
// auth.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({...}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],  // Export to use in other modules
})
export class AuthModule {}
```

## 📝 Creating a New Module

### Step 1: Generate Module
```bash
nest generate module users
nest generate controller users
nest generate service users
```

### Step 2: Create Module Structure
```
users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dtos/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
└── entities/
    └── user.entity.ts
```

### Step 3: Implement Module

**users.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**users.controller.ts**:
```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

**users.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

### Step 4: Register in App Module
```typescript
// app.module.ts
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ... other modules
    UsersModule,
  ],
})
export class AppModule {}
```

## 🔗 Module Communication

### Importing Services
```typescript
// In another module
@Module({
  imports: [UsersModule],  // Import the module
  // Now you can inject UsersService
})
export class OrdersModule {}
```

### Shared Modules
Export services to make them available:
```typescript
@Module({
  providers: [UsersService],
  exports: [UsersService],  // Export to make it available
})
export class UsersModule {}
```

## 🚀 Best Practices

- **Single Responsibility**: Each module should handle one feature
- **Clear Boundaries**: Keep module code contained
- **Dependency Injection**: Use DI for module dependencies
- **Exports**: Only export what other modules need
- **Documentation**: Document module purpose and usage
- **Testing**: Write tests for each module

