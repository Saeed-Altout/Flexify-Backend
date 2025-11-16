import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { EnvironmentVariables } from './config/env.validation';
import { SupabaseModule } from './core/lib/supabase/supabase.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const validatedConfig = new EnvironmentVariables();
        Object.assign(validatedConfig, config);
        return validatedConfig;
      },
    }),
    SupabaseModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: parseInt(
            configService.get<string>('THROTTLE_TTL') || '60000',
            10,
          ),
          limit: parseInt(
            configService.get<string>('THROTTLE_LIMIT') || '10',
            10,
          ),
        },
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
  ],
})
export class AppModule {}
