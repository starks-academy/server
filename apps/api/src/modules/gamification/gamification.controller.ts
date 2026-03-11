import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { PaginationDto } from '@app/common/dto/pagination.dto';
import { GamificationService } from './gamification.service';
import { BadgesService } from './badges/badges.service';

@ApiTags('gamification')
@ApiBearerAuth('JWT')
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly badgesService: BadgesService,
  ) {}

  @Public()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Top users ranked by XP' })
  getLeaderboard(@Query() pagination: PaginationDto) {
    return this.gamificationService.getLeaderboard(pagination);
  }

  @Get('me/xp')
  @ApiOperation({ summary: 'Own XP, level, and next threshold info' })
  getMyXp(@CurrentUser() user: User) {
    return this.gamificationService.getMyXp(user.id);
  }

  @Get('me/streak')
  @ApiOperation({ summary: 'Current and longest streak' })
  getMyStreak(@CurrentUser() user: User) {
    return this.gamificationService.getMyStreak(user.id);
  }

  @Public()
  @Get('badges')
  @ApiOperation({ summary: 'All available achievement badges' })
  getBadges() {
    return this.badgesService.getAll();
  }

  @Get('me/badges')
  @ApiOperation({ summary: 'Earned badges for the authenticated user' })
  getMyBadges(@CurrentUser() user: User) {
    return this.badgesService.getUserBadges(user.id);
  }
}
