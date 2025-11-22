import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import serverless from 'serverless-http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Dynamic imports to handle both dev and production builds
const getModules = () => {
  try {
    // Try production build first
    return {
      AppModule: require('../dist/app.module').AppModule,
      HttpExceptionFilter: require('../dist/core/filters/http-exception.filter').HttpExceptionFilter,
      TransformInterceptor: require('../dist/core/interceptors/transform.interceptor').TransformInterceptor,
    };
  } catch {
    // Fallback to source for development
    return {
      AppModule: require('../src/app.module').AppModule,
      HttpExceptionFilter: require('../src/core/filters/http-exception.filter').HttpExceptionFilter,
      TransformInterceptor: require('../src/core/interceptors/transform.interceptor').TransformInterceptor,
    };
  }
};

let cachedApp: any;
let cachedHandler: any;

async function bootstrap() {
  if (!cachedApp) {
    const { AppModule, HttpExceptionFilter, TransformInterceptor } = getModules();
    
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: process.env.NODE_ENV === 'production' 
          ? ['error', 'warn'] 
          : ['log', 'error', 'warn'],
      }
    );

    const configService = app.get(ConfigService);

    // Security: Helmet with relaxed settings for serverless
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }));

    // Cookie parser
    app.use(cookieParser());

    // CORS configuration
    const allowedOrigins = (configService.get<string>('CORS_ORIGINS') || '*')
      .split(',')
      .map(origin => origin.trim());
    
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    });

    // Global validation pipe
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

    // Initialize
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
  try {
    const serverlessHandler = await bootstrap();
    return await serverlessHandler(event, context);
  } catch (error: any) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error?.message, stack: error?.stack }),
      }),
    };
  }
}
