import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  QuizSession,
  QuizFormat,
} from '@app/database/entities/quiz-session.entity';
import { User } from '@app/database/entities/user.entity';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { AiGraderService } from './grader/ai-grader.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { QuizGeneratorService } from './generators/quiz-generator.service';
import { XpService, XP_REWARDS } from '../gamification/xp/xp.service';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    @InjectRepository(QuizSession)
    private readonly quizRepo: Repository<QuizSession>,
    private readonly graderService: AiGraderService,
    private readonly generatorService: QuizGeneratorService,
    private readonly xpService: XpService,
  ) {}

  /**
   * Generate a new quiz based on user preferences
   */
  async generateQuiz(user: User, dto: GenerateQuizDto): Promise<QuizSession> {
    this.logger.log(
      `Generating quiz for user ${user.id}: topic="${dto.topic}", format=${dto.format}`,
    );

    const { questions } = await this.generatorService.generateQuiz(
      dto.topic,
      dto.format,
      dto.includeAdvanced ?? false,
    );

    const session = this.quizRepo.create({
      userId: user.id,
      topic: dto.topic,
      format: dto.format as unknown as QuizFormat,
      includeAdvanced: dto.includeAdvanced ?? false,
      questions: questions as any,
    });

    const savedSession = await this.quizRepo.save(session);

    this.logger.log(
      `Quiz ${savedSession.id} generated with ${questions.length} questions`,
    );

    return savedSession;
  }

  /**
   * Submit and grade quiz answers
   */
  async submitAnswers(user: User, sessionId: string, dto: SubmitAnswersDto) {
    const session = await this.quizRepo.findOne({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      throw new NotFoundException('Quiz session not found');
    }

    if (session.gradedAt) {
      throw new ForbiddenException('Quiz has already been graded');
    }

    this.logger.log(`Grading quiz ${sessionId} for user ${user.id}`);

    const gradingResult = await this.graderService.grade(session, dto.answers);

    session.score = gradingResult.score;
    session.gradedAt = new Date();
    await this.quizRepo.save(session);

    // Award XP based on performance
    await this.awardQuizXp(user.id, gradingResult, sessionId);

    this.logger.log(
      `Quiz ${sessionId} graded: ${gradingResult.correctCount}/${gradingResult.totalQuestions} correct (${gradingResult.score}%)`,
    );

    return {
      sessionId,
      score: gradingResult.score,
      totalQuestions: gradingResult.totalQuestions,
      correctCount: gradingResult.correctCount,
      incorrectCount: gradingResult.incorrectCount,
      results: gradingResult.results,
    };
  }

  /**
   * Get user's quiz history
   */
  async getHistory(userId: string) {
    return this.quizRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  /**
   * Award XP based on quiz performance
   */
  private async awardQuizXp(
    userId: string,
    gradingResult: any,
    sessionId: string,
  ): Promise<void> {
    const { score, totalQuestions, correctCount } = gradingResult;
    const passingScore = 60;

    if (score >= 100) {
      // Perfect score
      await this.xpService.award(
        userId,
        XP_REWARDS.QUIZ_PERFECT,
        `Perfect quiz score (${totalQuestions}/${totalQuestions})`,
        sessionId,
      );
      this.logger.log(`Awarded ${XP_REWARDS.QUIZ_PERFECT} XP for perfect quiz`);
    } else if (score >= passingScore) {
      // Passing score
      await this.xpService.award(
        userId,
        XP_REWARDS.QUIZ_PASS,
        `Passed quiz (${correctCount}/${totalQuestions} correct)`,
        sessionId,
      );
      this.logger.log(`Awarded ${XP_REWARDS.QUIZ_PASS} XP for passing quiz`);
    } else {
      // Failed but still award some XP for effort
      const effortXp = Math.floor(XP_REWARDS.QUIZ_PASS * 0.3);
      await this.xpService.award(
        userId,
        effortXp,
        `Quiz attempt (${correctCount}/${totalQuestions} correct)`,
        sessionId,
      );
      this.logger.log(`Awarded ${effortXp} XP for quiz attempt`);
    }
  }
}
