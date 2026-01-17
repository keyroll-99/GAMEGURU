import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - pozwól na requesty z frontendu
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      /^https?:\/\/([a-z0-9-]+\.)?gtrip\.pl$/, // Matches gtrip.pl and any subdomain like app.gtrip.pl
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Globalna walidacja DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Usuwa pola nie zdefiniowane w DTO
      forbidNonWhitelisted: true, // Rzuca błąd dla nieznanych pól
      transform: true, // Automatyczna transformacja typów
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Swagger Configuration
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GameGuru API')
      .setDescription('API documentation for GameGuru project management tool')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
