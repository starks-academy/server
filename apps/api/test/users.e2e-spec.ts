import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '@app/database/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Users (e2e)', () => {
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
      displayName: 'Test User',
      xpTotal: 100,
      level: 2,
    });
    testUser = await userRepo.save(testUser);

    const tokens = authService.issueTokens(testUser);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    if (testUser && testUser.id) {
      const dataSource = app.get(DataSource);
      await dataSource.query('DELETE FROM user_progress WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM chat_sessions WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM quiz_sessions WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM xp_events WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM user_badges WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM certificates WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM gallery_projects WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    await app.close();
  });

  describe('/api/v1/users/me (GET)', () => {
    it('should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.walletAddress).toBe(testUser.walletAddress);
          expect(res.body.data.xpTotal).toBeGreaterThanOrEqual(0);
        });
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/v1/users/me (PATCH)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Name',
          bio: 'New bio',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.displayName).toBe('Updated Name');
          expect(res.body.data.bio).toBe('New bio');
        });
    });

    it('should reject invalid fields', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'admin', // Should not be updateable via this endpoint
        })
        .expect(400);
    });

    it('should validate URL formats', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          avatarUrl: 'not-a-url',
        })
        .expect(400);
    });
  });

  describe('/api/v1/users/:id (GET)', () => {
    it('should return user by id (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${testUser.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(testUser.id);
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/v1/users/:id/stats (GET)', () => {
    it('should return user stats', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${testUser.id}/stats`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('xpTotal');
          expect(res.body.data).toHaveProperty('level');
        });
    });
  });
});
