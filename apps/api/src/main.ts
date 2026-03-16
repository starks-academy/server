import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino structured logger
  app.useLogger(app.get(Logger));

  // Global API prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({ origin: '*' })
  // app.enableCors({
  //   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  //   credentials: true,
  // });

  // Swagger — only in non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Stacks Academy API')
      .setDescription(
        'Production-grade backend for the Stacks Academy learning platform',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Stacks wallet authentication')
      .addTag('users', 'User profiles and stats')
      .addTag('courses', 'Learning path and progress')
      .addTag('assessments', 'AI-generated quizzes and grading')
      .addTag('ai-tutor', 'Context-aware Claude AI tutor')
      .addTag('gamification', 'XP, levels, streaks, and leaderboard')
      .addTag('certificates', 'SIP-009 NFT certificate minting')
      .addTag('gallery', 'Builder project showcase')
      .addTag('builders', 'Builders connect directory')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Stacks Academy API running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
