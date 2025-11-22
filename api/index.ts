import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import express from 'express';
import serverless from 'serverless-http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../src/core/filters/http-exception.filter';
import { TransformInterceptor } from '../src/core/interceptors/transform.interceptor';

let cachedApp: any;
let cachedHandler: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: process.env.NODE_ENV === 'production' 
          ? ['error', 'warn'] 
          : ['log', 'error', 'warn', 'debug', 'verbose'],
      }
    );

    const configService = app.get(ConfigService);

    // Security: Helmet for HTTP headers
    app.use(helmet());

    // Cookie parser middleware
    app.use(cookieParser());

    // Enable CORS with proper configuration
    const allowedOrigins = configService
      .get<string>('CORS_ORIGINS', '*')
      .split(',');
    
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }
        
        // Allow all origins if '*' is in the list
        if (allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    });

    // Global validation pipe with strict validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global response interceptor
    app.useGlobalInterceptors(new TransformInterceptor());

    // Global prefix
    app.setGlobalPrefix('api');

    // Initialize the application
    await app.init();
    
    cachedApp = expressApp;
    cachedHandler = serverless(expressApp, {
      binary: ['image/*', 'application/pdf', 'application/zip'],
    });
  }

  return cachedHandler;
}

// Vercel serverless function handler
export default async function handler(event: any, context: any) {
  const serverlessHandler = await bootstrap();
  return serverlessHandler(event, context);
}

