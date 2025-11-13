import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { EnvironmentVariables } from './config/env.validation';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SeedersModule } from './seeders/seeders.module';
import { User } from './modules/users/entities/user.entity';
import { Session } from './modules/auth/entities/session.entity';
import { PasswordResetToken } from './modules/auth/entities/password-reset-token.entity';
import { VerificationCode } from './modules/auth/entities/verification-code.entity';
import { Project } from './modules/projects/entities/project.entity';
import { ProjectTranslation } from './modules/projects/entities/project-translation.entity';
import { ProjectRating } from './modules/projects/entities/project-rating.entity';
import { ProjectLike } from './modules/projects/entities/project-like.entity';

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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: parseInt(configService.get('DB_PORT') || '5432', 10),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [
          User,
          Session,
          PasswordResetToken,
          VerificationCode,
          Project,
          ProjectTranslation,
          ProjectRating,
          ProjectLike,
        ],
        synchronize: true,
        ssl:
          configService.get('DB_SSL_MODE') === 'require'
            ? { rejectUnauthorized: false }
            : false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
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
    ProjectsModule,
    SeedersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
