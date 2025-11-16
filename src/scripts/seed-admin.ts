import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupabaseService } from '../core/lib/supabase/supabase.service';
import { Logger } from '@nestjs/common';

async function seedAdmin() {
  const logger = new Logger('SeedAdmin');
  
  try {
    logger.log('🚀 Starting admin user seeding...');
    
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const supabaseService = app.get(SupabaseService);

    const adminEmail = 'admin@flexify.com';
    const adminPassword = 'admin123';

    // Check if admin user already exists
    const existingAdmin = await supabaseService.getUserByEmail(adminEmail);
    
    if (existingAdmin) {
      logger.warn(`⚠️  Admin user with email ${adminEmail} already exists.`);
      logger.log('   Skipping admin user creation.');
      await app.close();
      return;
    }

    // Hash password
    const passwordHash = await supabaseService.hashPassword(adminPassword);

    // Check if Supabase is properly configured
    if (supabaseService['isDevelopmentMode']) {
      logger.error('❌ Supabase is not configured!');
      logger.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
      logger.error('   Example:');
      logger.error('   SUPABASE_URL=https://your-project.supabase.co');
      logger.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
      await app.close();
      process.exit(1);
    }

    // Create admin user directly with all fields
    // Using the supabase client directly to insert with all required fields
    const { data: adminUser, error } = await supabaseService.supabase
      .from('users')
      .insert({
        email: adminEmail,
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        email_verified: true,
        phone_verified: false,
        language: 'en',
        metadata: {},
        settings: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }

    if (!adminUser) {
      throw new Error('Failed to create admin user: No data returned');
    }

    logger.log('✅ Admin user created successfully!');
    logger.log(`   Email: ${adminEmail}`);
    logger.log(`   Password: ${adminPassword}`);
    logger.log(`   Role: ${adminUser.role}`);
    logger.log(`   Status: ${adminUser.status}`);
    logger.log(`   ID: ${adminUser.id}`);

    await app.close();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error seeding admin user:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

seedAdmin();

