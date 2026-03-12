import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const testWalletAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';

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
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/challenge (POST)', () => {
    it('should generate a challenge nonce', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/challenge')
        .send({ walletAddress: testWalletAddress })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('nonce');
          expect(res.body.data).toHaveProperty('expiresAt');
          expect(res.body.data).toHaveProperty('message');
          expect(res.body.data.message).toContain('Sign this message');
        });
    });

    it('should reject invalid wallet address format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/challenge')
        .send({ walletAddress: 'invalid-address' })
        .expect(400);
    });

    it('should reject missing wallet address', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/challenge')
        .send({})
        .expect(400);
    });
  });

  describe('/api/v1/auth/verify (POST)', () => {
    let nonce: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/challenge')
        .send({ walletAddress: testWalletAddress });
      nonce = response.body.data.nonce;
    });

    it('should reject invalid signature', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify')
        .send({
          walletAddress: testWalletAddress,
          signature: 'invalid-signature',
          publicKey: 'invalid-public-key',
        })
        .expect(401);
    });

    it('should reject missing fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify')
        .send({ walletAddress: testWalletAddress })
        .expect(400);
    });

    it('should reject verification without challenge', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify')
        .send({
          walletAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
          signature: 'some-signature',
          publicKey: 'some-public-key',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.error.message).toContain('No pending challenge');
        });
    });
  });
});
