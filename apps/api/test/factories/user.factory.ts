import { User, UserRole } from '@app/database/entities/user.entity';

export class UserFactory {
  static create(overrides?: Partial<User>): User {
    const user = new User();
    user.id = overrides?.id || '123e4567-e89b-12d3-a456-426614174000';
    user.walletAddress = overrides?.walletAddress || 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
    user.displayName = overrides?.displayName || 'Test User';
    user.bio = overrides?.bio || null;
    user.avatarUrl = overrides?.avatarUrl || null;
    user.xpTotal = overrides?.xpTotal || 0;
    user.level = overrides?.level || 1;
    user.streakDays = overrides?.streakDays || 0;
    user.longestStreak = overrides?.longestStreak || 0;
    user.lastActivityAt = overrides?.lastActivityAt || new Date();
    user.role = overrides?.role || UserRole.USER;
    user.createdAt = overrides?.createdAt || new Date();
    user.updatedAt = overrides?.updatedAt || new Date();

    return user;
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({ ...overrides, id: `user-${i}` }),
    );
  }
}
