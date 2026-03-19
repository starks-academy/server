import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuizSession } from '@app/database/entities/quiz-session.entity';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AiGraderService } from './grader/ai-grader.service';
import { QuizGeneratorService } from './generators/quiz-generator.service';
import { PromptBuilderService } from './generators/prompt-builder.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSession]),
    HttpModule.register({
      timeout: 120000,
      maxRedirects: 5,
      proxy: false, // Disable proxy
    }),
    GamificationModule,
  ],
  controllers: [AssessmentsController],
  providers: [
    AssessmentsService,
    AiGraderService,
    QuizGeneratorService,
    PromptBuilderService,
  ],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
