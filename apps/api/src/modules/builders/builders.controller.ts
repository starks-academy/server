import { Body, Controller, Get, Param, Post, Query, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { BuilderCategory } from '@app/database/entities/builder-profile.entity';
import { BuildersService } from './builders.service';
import { SubmitBuilderDto } from './dto/submit-builder.dto';
import { ApproveBuilderDto, RejectBuilderDto } from './dto/approve-builder.dto';

@ApiTags('builders')
@ApiBearerAuth('JWT')
@Controller('builders')
export class BuildersController {
  constructor(private readonly buildersService: BuildersService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved builder profiles' })
  findAll(@Query('category') category?: BuilderCategory) {
    return this.buildersService.findAll(category);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a builder profile' })
  findOne(@Param('id') id: string) {
    return this.buildersService.findOne(id);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit own profile for community review' })
  submit(@CurrentUser() user: User, @Body() dto: SubmitBuilderDto) {
    return this.buildersService.submit(user.id, dto);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  @Get('admin/pending')
  @ApiOperation({ summary: '[ADMIN] List all pending builder profiles awaiting approval' })
  getPending() {
    return this.buildersService.findPending();
  }

  @Patch('admin/:id/approve')
  @ApiOperation({ summary: '[ADMIN] Approve a builder profile' })
  approve(@Param('id') id: string, @Body() dto: ApproveBuilderDto) {
    return this.buildersService.approve(id, dto);
  }

  @Patch('admin/:id/reject')
  @ApiOperation({ summary: '[ADMIN] Reject a builder profile' })
  reject(@Param('id') id: string, @Body() dto: RejectBuilderDto) {
    return this.buildersService.reject(id, dto);
  }
}
