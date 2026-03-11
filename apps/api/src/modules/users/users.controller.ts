import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'View any user profile' })
  getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user XP/level/streak stats' })
  getUserStats(@Param('id') id: string) {
    return this.usersService.getStats(id);
  }
}
