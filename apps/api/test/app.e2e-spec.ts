import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    
    app.setGlobalPrefix('api/v1');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - should return 404 for root', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(404);
  });

  it('/api/v1/courses (GET) - should return courses list', () => {
    return request(app.getHttpServer())
      .get('/api/v1/courses')
      .expect(200);
  });
});
