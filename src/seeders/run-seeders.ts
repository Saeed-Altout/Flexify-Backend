import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from './database.seeder';

async function runSeeders() {
  console.log('🚀 Initiating the database seeding process...');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the seeder service
    const databaseSeeder = app.get(DatabaseSeeder);

    // Run the seeders
    await databaseSeeder.seed();

    // Close the application
    await app.close();

    console.log('\n✅ Database seeding finished successfully!');
    console.log('-----------------------------------------');
    console.log('📋 Next steps:\n');
    console.log('   - Your database is now ready with initial data.');
    console.log(
      '   - You can log in to the admin panel using the seeded credentials.',
    );
    console.log('\n🎊 Happy developing!');
  } catch (error) {
    console.error('\n❌ Database seeding encountered an error:', error);
    console.error('💡 Please check your configuration and try again.');
    process.exit(1);
  }
}

// Run the seeders
runSeeders();
