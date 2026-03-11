import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { BuilderCategory } from '@app/database/entities/builder-profile.entity';
import { BuildersService } from './builders.service';
import { SubmitBuilderDto } from './dto/submit-builder.dto';

@ApiTags('builders')
@ApiBearerAuth('JWT')
@Controller('builders')
export class BuildersController {
  constructor(private readonly buildersService: BuildersService) {}

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
}
