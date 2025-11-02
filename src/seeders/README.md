# Seeders Directory (`seeders/`)

This directory contains database seeding scripts that populate the database with initial or test data.

## 📁 Structure

```
seeders/
├── database.seeder.ts    # Main database seeder
├── run-seeders.ts        # Script to run seeders
├── seeders.module.ts     # Seeder module configuration
└── seeders.controller.ts # Optional: HTTP endpoint to run seeders
```

## 🎯 Purpose

Seeders provide:
- **Initial Data**: Populate database with essential data (roles, permissions, admin users)
- **Test Data**: Create sample data for development/testing
- **Data Migration**: Migrate data between environments
- **Reproducibility**: Consistent database state

## 💡 How It Works

### Database Seeder (`database.seeder.ts`)
Main seeder class that orchestrates all seeding:

```typescript
@Injectable()
export class DatabaseSeeder {
  async seed(clearPermissions: boolean = false): Promise<void> {
    // Seed roles
    await this.seedRoles();
    
    // Seed permissions
    await this.seedPermissions();
    
    // Seed admin user
    await this.seedAdminUser();
  }

  private async seedRoles(): Promise<void> {
    // Create roles (admin, user, etc.)
  }

  private async seedPermissions(): Promise<void> {
    // Create permissions
  }

  private async assignPermissionsToRoles(): Promise<void> {
    // Assign permissions to roles
  }
}
```

### Run Seeders Script (`run-seeders.ts`)
Executable script to run seeders:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from './database.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(DatabaseSeeder);
  
  await seeder.seed();
  await app.close();
}

bootstrap();
```

### Running Seeders
```bash
# Via npm script
npm run seed

# Or directly
ts-node src/seeders/run-seeders.ts
```

## 📝 Creating Seeders

### Example: User Seeder
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const admin = this.userRepository.create({
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      });

      await this.userRepository.save(admin);
      console.log('Admin user seeded');
    }
  }
}
```

### Example: Role Seeder
```typescript
@Injectable()
export class RoleSeeder {
  async seed(): Promise<void> {
    const roles = [
      { name: 'admin', description: 'Administrator' },
      { name: 'user', description: 'Regular user' },
      { name: 'moderator', description: 'Moderator' },
    ];

    for (const roleData of roles) {
      const exists = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!exists) {
        await this.roleRepository.save(roleData);
      }
    }
  }
}
```

## 🔧 Seeder Module Configuration

**seeders.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeeder } from './database.seeder';
import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
  ],
  providers: [DatabaseSeeder],
})
export class SeedersModule {}
```

## 🚀 Best Practices

- **Idempotency**: Seeders should be safe to run multiple times
- **Existence Checks**: Check if data exists before creating
- **Transaction Safety**: Consider using transactions for related data
- **Environment Aware**: Different seeders for dev/prod/test
- **Clear Logging**: Log what's being seeded
- **Error Handling**: Handle errors gracefully

## 📋 Common Seeding Patterns

### Conditional Seeding
```typescript
async seed(): Promise<void> {
  const count = await this.repository.count();
  if (count === 0) {
    // Only seed if table is empty
    await this.seedData();
  }
}
```

### Clear and Reseed
```typescript
async seed(clear: boolean = false): Promise<void> {
  if (clear) {
    await this.repository.clear();
  }
  await this.seedData();
}
```

### Bulk Seeding
```typescript
async seed(): Promise<void> {
  const data = [/* large array */];
  await this.repository.save(data); // Bulk insert
}
```

