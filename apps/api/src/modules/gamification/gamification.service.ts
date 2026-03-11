import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database/entities/user.entity';
import { XpService } from './xp/xp.service';
import { BadgesService } from './badges/badges.service';
import { PaginationDto } from '@app/common/dto/pagination.dto';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly xpService: XpService,
    private readonly badgesService: BadgesService,
  ) {}

  async getLeaderboard(pagination: PaginationDto) {
    const [users, total] = await this.userRepo.findAndCount({
      order: { xpTotal: 'DESC' },
      select: ['id', 'walletAddress', 'displayName', 'avatarUrl', 'xpTotal', 'level', 'streakDays'],
      skip: pagination.skip,
      take: pagination.limit,
    });

    return {
      data: users.map((u, i) => ({ rank: pagination.skip + i + 1, ...u })),
      meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) },
    };
  }

  async getMyXp(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return this.xpService.getLevelInfo(user.xpTotal);
  }

  async getMyStreak(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return { streakDays: user.streakDays, longestStreak: user.longestStreak, lastActivityAt: user.lastActivityAt };
  }
}
