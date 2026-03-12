import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '@app/database/entities/user.entity';
import { UserProgress } from '@app/database/entities/user-progress.entity';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Courses (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userRepo: Repository<User>;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    const authService = moduleFixture.get<AuthService>(AuthService);

    // Create a test user
    const randomWallet = `SP${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    testUser = userRepo.create({
      walletAddress: randomWallet,
      displayName: 'Course Test User',
    });
    testUser = await userRepo.save(testUser);

    const tokens = authService.issueTokens(testUser);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    if (testUser && testUser.id) {
      const progressRepo = app.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
      await progressRepo.delete({ userId: testUser.id });
      await userRepo.delete(testUser.id);
    }
    await app.close();
  });

  describe('/api/v1/courses (GET)', () => {
    it('should return all courses (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/courses')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/v1/courses/:id (GET)', () => {
    it('should return a single course with lessons', () => {
      return request(app.getHttpServer())
        .get('/api/v1/courses/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', 1);
          expect(res.body.data).toHaveProperty('title');
          expect(res.body.data).toHaveProperty('lessons');
        });
    });

    it('should return 404 for non-existent course', () => {
      return request(app.getHttpServer())
        .get('/api/v1/courses/99999')
        .expect(404);
    });

    it('should reject invalid course id format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/courses/invalid-id')
        .expect(400);
    });
  });

  describe('/api/v1/courses/:id/progress (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/courses/1/progress')
        .expect(401);
    });

    it('should return user progress for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/courses/1/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('completedSteps');
          expect(res.body.data).toHaveProperty('totalSteps');
          expect(res.body.data).toHaveProperty('progressPercentage');
        });
    });
  });

  describe('/api/v1/courses/:courseId/lessons/:lessonId/steps/:stepId/complete (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/courses/1/lessons/1/steps/1/complete')
        .expect(401);
    });

    it('should mark step as complete for authenticated user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/courses/1/lessons/1/steps/1/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('state');
          expect(res.body.data.state).toBe('completed');
        });
    });

    it('should be idempotent (completing twice should work)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/courses/1/lessons/1/steps/1/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });
  });
});
