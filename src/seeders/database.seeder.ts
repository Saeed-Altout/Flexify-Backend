import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../modules/users/entities/user.entity';

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting database seeding...');

    await this.seedAdminUser();

    this.logger.log('Database seeding completed successfully!');
  }

  private async seedAdminUser(): Promise<void> {
    this.logger.log('Seeding admin user...');

    const adminEmail = 'admin@flexify.com';
    const adminPassword = 'admin123';

    // Check if admin user already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log(
        `Admin user with email ${adminEmail} already exists. Skipping...`,
      );
      return;
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const adminUser = this.userRepository.create({
      email: adminEmail,
      password_hash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      status: 'active',
      email_verified: true,
      phone_verified: false,
      language: 'en',
    });

    await this.userRepository.save(adminUser);

    this.logger.log(`✅ Admin user created successfully!`);
    this.logger.log(`   Email: ${adminEmail}`);
    this.logger.log(`   Password: ${adminPassword}`);
    this.logger.log(`   Role: admin`);
  }

  private async seedRoles(): Promise<void> {
    // Future implementation for roles
  }

  private async seedPermissions(): Promise<void> {
    // Future implementation for permissions
  }
}
