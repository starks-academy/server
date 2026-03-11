import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/entities/user.entity';
import { AssessmentsService } from './assessments.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

@ApiTags('assessments')
@ApiBearerAuth('JWT')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a personalized quiz using AI' })
  generate(@CurrentUser() user: User, @Body() dto: GenerateQuizDto) {
    return this.assessmentsService.generateQuiz(user, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit quiz answers for AI grading' })
  submit(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.assessmentsService.submitAnswers(user, id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past quiz sessions and scores' })
  getHistory(@CurrentUser() user: User) {
    return this.assessmentsService.getHistory(user.id);
  }

  @Get('quota')
  @ApiOperation({ summary: 'Get remaining daily quiz quota' })
  getQuota(@CurrentUser() user: User) {
    return this.assessmentsService.getQuota(user);
  }
}
