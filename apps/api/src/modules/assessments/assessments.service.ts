import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import {
  QuizSession,
  QuizFormat,
} from '@app/database/entities/quiz-session.entity';
import { User } from '@app/database/entities/user.entity';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { AiGraderService } from './grader/ai-grader.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { QuizGeneratorService } from './generators/quiz-generator.service';

const FREE_DAILY_LIMIT = 2;

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    @InjectRepository(QuizSession)
    private readonly quizRepo: Repository<QuizSession>,
    private readonly graderService: AiGraderService,
    private readonly generatorService: QuizGeneratorService,
  ) {}

  /**
   * Generate a new quiz based on user preferences
   */
  async generateQuiz(user: User, dto: GenerateQuizDto): Promise<QuizSession> {
    await this.checkQuota(user);

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
   * Get user's remaining quiz quota
   */
  async getQuota(user: User) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.quizRepo.count({
      where: { userId: user.id, createdAt: MoreThan(today) },
    });

    const limit = user.isPro ? Infinity : FREE_DAILY_LIMIT;

    return {
      used: count,
      limit,
      remaining: Math.max(0, limit - count),
    };
  }

  /**
   * Check if user has remaining quota
   */
  private async checkQuota(user: User) {
    if (user.isPro) return;

    const { used, limit } = await this.getQuota(user);

    if (used >= limit) {
      throw new ForbiddenException(
        `Daily quiz limit of ${limit} reached. Upgrade to Pro for unlimited quizzes.`,
      );
    }
  }
}
