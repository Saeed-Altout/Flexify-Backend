# Entities Directory (`entities/`)

This directory contains TypeORM entities that represent database tables and their relationships.

## 🎯 Purpose

Entities define:

- **Database Schema**: Table structure and columns
- **Relationships**: Associations between tables (One-to-Many, Many-to-One, etc.)
- **Data Types**: Column types and constraints
- **Indexes**: Database indexes for performance

## 💡 How It Works

### Basic Entity Structure

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
```

### Common Decorators

- `@Entity('table_name')` - Maps class to database table
- `@PrimaryGeneratedColumn()` - Auto-increment primary key
- `@Column()` - Regular column
- `@CreateDateColumn()` - Auto-managed creation timestamp
- `@UpdateDateColumn()` - Auto-managed update timestamp
- `@OneToMany()` / `@ManyToOne()` / `@ManyToMany()` - Relationships

## 📝 Usage Examples

### Creating an Entity

```typescript
// entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Using Entity in Repository

```typescript
// In a service
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

### Registering Entity in Module

```typescript
// In a feature module
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  // ...
})
export class UsersModule {}
```

## 🔗 Relationships

### One-to-Many / Many-to-One

```typescript
// User entity
@OneToMany(() => Post, post => post.author)
posts: Post[];

// Post entity
@ManyToOne(() => User, user => user.posts)
author: User;
```

### Many-to-Many

```typescript
@ManyToMany(() => Role, role => role.users)
@JoinTable()
roles: Role[];
```

## 🚀 Best Practices

- **Naming**: Use PascalCase for class names, snake_case for table names
- **Timestamps**: Use `@CreateDateColumn()` and `@UpdateDateColumn()` for consistency
- **Relationships**: Define both sides of relationships
- **Indexes**: Add indexes for frequently queried columns
- **Validation**: Combine with DTOs for input validation
