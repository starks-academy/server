import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common/decorators/public.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@ApiBearerAuth('JWT')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all course modules' })
  getCurriculum() {
    return this.coursesService.getCurriculum();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single course with its lessons' })
  getCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getCourseById(id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: "Get user's progress for a course" })
  getCourseProgress(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getUserProgress(user.id, id);
  }

  @Post(':courseId/lessons/:lessonId/steps/:stepId/complete')
  @ApiOperation({ summary: 'Mark a lesson step as complete' })
  completeStep(
    @CurrentUser() user: User,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
  ) {
    return this.coursesService.completeStep(user.id, courseId, lessonId, stepId);
  }
}
