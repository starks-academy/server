import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@app/database/entities/user.entity';
import { createMockRepository } from '../../../test/mocks/repository.mock';
import { mockJwtService } from '../../../test/mocks/jwt.mock';
import { UserFactory } from '../../../test/factories/user.factory';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwtService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateChallenge', () => {
    it('should generate a challenge with nonce and expiry', async () => {
      const walletAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
      const result = await service.generateChallenge(walletAddress);

      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('Sign this message');
      expect(result.message).toContain(result.nonce);
      expect(typeof result.nonce).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate unique nonces for different requests', async () => {
      const walletAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
      const result1 = await service.generateChallenge(walletAddress);
      const result2 = await service.generateChallenge(walletAddress);

      expect(result1.nonce).not.toBe(result2.nonce);
    });
  });

  describe('issueTokens', () => {
    it('should issue access and refresh tokens', () => {
      const mockUser = UserFactory.create();
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockJwtService.sign.mockReturnValueOnce('refresh-token');

      const result = service.issueTokens(mockUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const mockUser = UserFactory.create();
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser('non-existent');

      expect(result).toBeNull();
    });
  });
});
