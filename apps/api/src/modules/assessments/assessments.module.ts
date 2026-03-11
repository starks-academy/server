import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuizSession } from '@app/database/entities/quiz-session.entity';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AiGraderService } from './grader/ai-grader.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuizSession]), HttpModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AiGraderService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
