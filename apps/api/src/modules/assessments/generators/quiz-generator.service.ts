import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { QuizFormatDto } from '../dto/generate-quiz.dto';
import { GeneratedQuiz, Question, QuestionType } from '../types/question.types';
import { PromptBuilderService } from './prompt-builder.service';

/**
 * Service responsible for generating quizzes using AI
 */
@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Generate a quiz using AI based on the provided parameters
   */
  async generateQuiz(
    topic: string,
    format: QuizFormatDto,
    includeAdvanced: boolean,
  ): Promise<GeneratedQuiz> {
    const prompt = this.promptBuilder.buildGenerationPrompt(
      topic,
      format,
      includeAdvanced,
    );

    this.logger.debug(`Generating quiz for topic: ${topic}, format: ${format}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: this.config.get('anthropic.model'),
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              'content-type': 'application/json',
              'x-api-key': this.config.get('anthropic.apiKey'),
              'anthropic-version': '2023-06-01',
            },
            timeout: 120000,
          },
        ),
      );

      const rawText = response.data.content[0].text;
      const questions = this.parseQuestions(rawText);

      this.validateQuestions(questions, format);

      return { questions };
    } catch (error) {
      this.logger.error('Failed to generate quiz', error);
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  }

  /**
   * Parse and clean the AI response to extract questions
   */
  private parseQuestions(rawText: string): Question[] {
    // Remove markdown code blocks if present
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    try {
      const parsed = JSON.parse(cleanedText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.error('Failed to parse AI response', error);
      throw new Error('Failed to generate valid quiz questions');
    }
  }

  /**
   * Validate that generated questions match the expected format
   */
  private validateQuestions(questions: Question[], format: QuizFormatDto): void {
    if (!questions || questions.length === 0) {
      throw new Error('No questions were generated');
    }

    for (const question of questions) {
      // Validate common fields
      if (!question.id || !question.type || !question.question) {
        throw new Error('Question missing required fields');
      }

      // Validate type-specific fields
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        if (
          !question.options ||
          question.options.length !== 4 ||
          !question.correctOptionId
        ) {
          throw new Error('Invalid multiple-choice question structure');
        }
      } else if (question.type === QuestionType.OPEN_ENDED) {
        if (!question.modelAnswer) {
          throw new Error('Open-ended question missing model answer');
        }
      }
    }

    // Validate format consistency
    const hasMultipleChoice = questions.some(
      (q) => q.type === QuestionType.MULTIPLE_CHOICE,
    );
    const hasOpenEnded = questions.some(
      (q) => q.type === QuestionType.OPEN_ENDED,
    );

    if (format === QuizFormatDto.MULTI_CHOICE && !hasMultipleChoice) {
      throw new Error('Expected multiple-choice questions but none were generated');
    }

    if (format === QuizFormatDto.OPEN_ENDED && !hasOpenEnded) {
      throw new Error('Expected open-ended questions but none were generated');
    }

    if (format === QuizFormatDto.MIXED && (!hasMultipleChoice || !hasOpenEnded)) {
      throw new Error('Mixed format requires both question types');
    }

    this.logger.debug(
      `Validated ${questions.length} questions (${questions.filter((q) => q.type === QuestionType.MULTIPLE_CHOICE).length} MC, ${questions.filter((q) => q.type === QuestionType.OPEN_ENDED).length} OE)`,
    );
  }
}
