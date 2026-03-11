import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database/entities/user.entity';
import { XpEvent } from '@app/database/entities/xp-event.entity';

export const XP_REWARDS = {
  LESSON_STEP_COMPLETE: 50,
  QUIZ_PASS: 150,
  QUIZ_PERFECT: 250,
  DAILY_STREAK: 25,
  FIRST_CONTRACT: 500,
  MODULE_COMPLETE: 300,
  GALLERY_SUBMIT: 200,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Stacker Novice', xp: 0 },
  { level: 2, title: 'Clarity Coder', xp: 500 },
  { level: 3, title: 'Bitcoin Builder', xp: 1500 },
  { level: 4, title: 'L2 Architect', xp: 4000 },
];

@Injectable()
export class XpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(XpEvent)
    private readonly xpEventRepo: Repository<XpEvent>,
  ) {}

  async award(userId: string, amount: number, reason: string, referenceId?: string) {
    // Record XP event
    const event = this.xpEventRepo.create({ userId, amount, reason, referenceId });
    await this.xpEventRepo.save(event);

    // Update user total and level
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    user.xpTotal += amount;
    user.level = this.calculateLevel(user.xpTotal);

    // Update streak
    const today = new Date().toDateString();
    const lastActivity = user.lastActivityAt?.toDateString();
    if (lastActivity !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      user.streakDays = lastActivity === yesterday ? user.streakDays + 1 : 1;
      user.longestStreak = Math.max(user.longestStreak, user.streakDays);
      user.lastActivityAt = new Date();
    }

    await this.userRepo.save(user);
    return { newTotal: user.xpTotal, level: user.level };
  }

  private calculateLevel(xp: number): number {
    return LEVEL_THRESHOLDS
      .filter((t) => xp >= t.xp)
      .at(-1)?.level ?? 1;
  }

  getLevelInfo(xp: number) {
    const current = LEVEL_THRESHOLDS.filter((t) => xp >= t.xp).at(-1);
    const next = LEVEL_THRESHOLDS.find((t) => t.xp > xp);
    return {
      level: current.level,
      title: current.title,
      currentXp: xp,
      nextLevelXp: next?.xp ?? null,
      xpToNext: next ? next.xp - xp : 0,
    };
  }
}
