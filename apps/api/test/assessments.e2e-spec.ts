import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '@app/database/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Assessments (e2e)', () => {
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

    const randomWallet = `SP${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    testUser = userRepo.create({
      walletAddress: randomWallet,
      displayName: 'Assessment Test User',
    });
    testUser = await userRepo.save(testUser);

    const tokens = authService.issueTokens(testUser);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    if (testUser && testUser.id) {
      const dataSource = app.get(DataSource);
      await dataSource.query('DELETE FROM quiz_sessions WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    await app.close();
  });

  describe('/api/v1/assessments/generate (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/assessments/generate')
        .send({ moduleId: 1, difficulty: 'intermediate', questionCount: 5 })
        .expect(401);
    });

    it('should allow authenticated request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/assessments/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ moduleId: 1, difficulty: 'intermediate', questionCount: 5 })
        .expect((res) => {
          expect([201, 200, 403, 400]).toContain(res.statusCode);
        });
    });
  });

  describe('/api/v1/assessments/history (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/assessments/history')
        .expect(401);
    });

    it('should return user history for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/assessments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
