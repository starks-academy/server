import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { PaginationDto } from '@app/common/dto/pagination.dto';
import { GalleryService } from './gallery.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { GalleryQueryDto } from './dto/gallery-query.dto';
import { ModerateProjectDto } from './dto/moderate-project.dto';

@ApiTags('gallery')
@ApiBearerAuth('JWT')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Paginated list of approved community projects' })
  findAll(@Query() query: GalleryQueryDto) {
    return this.galleryService.findAll(query, query);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new project to the gallery' })
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.galleryService.create(user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single project detail' })
  findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own project' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CreateProjectDto) {
    return this.galleryService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own project' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.galleryService.remove(user.id, id);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Toggle upvote for a project' })
  vote(@CurrentUser() user: User, @Param('id') id: string) {
    return this.galleryService.toggleVote(user.id, id);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  @Get('admin/pending')
  @ApiOperation({ summary: '[ADMIN] List all pending projects awaiting moderation' })
  getPending(@Query() query: GalleryQueryDto) {
    return this.galleryService.findPending(query);
  }

  @Patch('admin/:id/moderate')
  @ApiOperation({ summary: '[ADMIN] Moderate a project (approve/reject)' })
  moderate(@Param('id') id: string, @Body() dto: ModerateProjectDto) {
    return this.galleryService.moderate(id, dto);
  }
}
