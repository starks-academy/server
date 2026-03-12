import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database/entities/user.entity';
import { AppModule } from '../../src/app.module';

export class TestHelper {
  static async createTestUser(
    app: INestApplication,
    walletAddress: string = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  ): Promise<{ user: User; token: string }> {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const authService = app.get('AuthService');

    let user = await userRepo.findOne({ where: { walletAddress } });
    
    if (!user) {
      user = userRepo.create({
        walletAddress,
        displayName: 'Test User',
        xpTotal: 100,
        level: 2,
      });
      user = await userRepo.save(user);
    }

    const tokens = authService.issueTokens(user);
    return { user, token: tokens.accessToken };
  }

  static async cleanupTestUser(app: INestApplication, userId: string) {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    await userRepo.delete(userId);
  }
}
