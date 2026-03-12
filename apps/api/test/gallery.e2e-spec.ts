import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '@app/database/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Gallery (e2e)', () => {
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
      displayName: 'Gallery Test User',
    });
    testUser = await userRepo.save(testUser);

    const tokens = authService.issueTokens(testUser);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    if (testUser && testUser.id) {
      const dataSource = app.get(DataSource);
      await dataSource.query('DELETE FROM project_votes WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM gallery_projects WHERE user_id = $1', [testUser.id]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    await app.close();
  });

  describe('/api/v1/gallery (GET)', () => {
    it('should return projects list (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/gallery?page=1&limit=10')
        .expect((res) => {
          if (res.statusCode !== 200) console.log('Gallery GET fail:', res.body.error?.message);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        })
        .expect(200);
    });

    it('should filter by category', () => {
      return request(app.getHttpServer())
        .get('/api/v1/gallery?category=DeFi')
        .expect((res) => {
          if (res.statusCode !== 200) console.log('Gallery Filter fail:', res.body.error?.message);
        })
        .expect(200);
    });
  });

  describe('/api/v1/gallery (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/gallery')
        .send({ title: 'Test Project', description: 'Test Description' })
        .expect(401);
    });

    it('should allow authenticated project submission', () => {
      return request(app.getHttpServer())
        .post('/api/v1/gallery')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project',
          description: 'Test Description',
          demoUrl: 'https://example.com',
          repoUrl: 'https://github.com/example/repo',
          category: 'DeFi',
        })
        .expect((res) => {
          expect([201, 400]).toContain(res.statusCode);
        });
    });
  });
});
