import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '@app/database/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AI Tutor (e2e)', () => {
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
      displayName: 'AI Tutor Test User',
    });
    testUser = await userRepo.save(testUser);

    const tokens = authService.issueTokens(testUser);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    if (testUser && testUser.id) {
      const dataSource = app.get(DataSource);
      await dataSource.query('DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)', [testUser.id]);
      await dataSource.query('DELETE FROM chat_sessions WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    await app.close();
  });

  describe('/api/v1/ai-tutor/chat (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ai-tutor/chat')
        .send({ message: 'Hello' })
        .expect(401);
    });

    it('should allow authenticated chat', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ai-tutor/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello' })
        .expect((res) => {
          expect(res.statusCode).not.toBe(401);
        });
    });
  });

  describe('/api/v1/ai-tutor/sessions (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ai-tutor/sessions')
        .expect(401);
    });

    it('should return sessions for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ai-tutor/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
