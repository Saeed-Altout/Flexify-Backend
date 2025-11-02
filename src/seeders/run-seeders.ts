#!/usr/bin/env node

/**
 * Database Seeder Script
 *
 * This script runs the database seeders to populate the database with:
 * - Roles (super_admin, admin, user, agent, moderator)
 * - Permissions (based on all services)
 * - Admin user (admin@sanam.com / admin123)
 *
 * Usage:
 * npm run seed
 * or
 * node dist/seeders/run-seeders.js
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from './database.seeder';

async function runSeeders() {
  console.log('🚀 Starting database seeding process...\n');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the seeder service
    const databaseSeeder = app.get(DatabaseSeeder);

    // Run the seeders
    await databaseSeeder.seed();

    // Close the application
    await app.close();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('\n🌐 You can now login to the admin panel!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeders
runSeeders();
