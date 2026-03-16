import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { QuizSession } from '@app/database/entities/quiz-session.entity';
import {
  Question,
  QuestionType,
  MultipleChoiceQuestion,
  OpenEndedQuestion,
} from '../types/question.types';

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  feedback: string;
  userAnswer: string;
}

export interface GradingResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  results: QuestionResult[];
}

/**
 * Service responsible for grading quiz answers
 */
@Injectable()
export class AiGraderService {
  private readonly logger = new Logger(AiGraderService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get('anthropic.apiKey'),
    });
  }

  /**
   * Grade quiz answers based on question types
   */
  async grade(
    session: QuizSession,
    answers: Record<string, string>,
  ): Promise<GradingResult> {
    const questions = session.questions as Question[];
    const results: QuestionResult[] = [];

    for (const question of questions) {
      const userAnswer = answers[question.id] || '';
      const result = await this.gradeQuestion(question, userAnswer);
      results.push(result);
    }

    const correctCount = results.filter((r) => r.correct).length;
    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    this.logger.debug(
      `Graded quiz ${session.id}: ${correctCount}/${totalQuestions} correct (${score}%)`,
    );

    return {
      score,
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      results,
    };
  }

  /**
   * Grade a single question based on its type
   */
  private async gradeQuestion(
    question: Question,
    userAnswer: string,
  ): Promise<QuestionResult> {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      return this.gradeMultipleChoice(
        question as MultipleChoiceQuestion,
        userAnswer,
      );
    } else {
      return await this.gradeOpenEnded(
        question as OpenEndedQuestion,
        userAnswer,
      );
    }
  }

  /**
   * Grade a multiple-choice question (simple comparison)
   */
  private gradeMultipleChoice(
    question: MultipleChoiceQuestion,
    userAnswer: string,
  ): QuestionResult {
    const correct = userAnswer === question.correctOptionId;

    return {
      questionId: question.id,
      correct,
      userAnswer,
      feedback: correct
        ? question.explanation
        : `Incorrect. The correct answer is ${question.correctOptionId}. ${question.explanation}`,
    };
  }

  /**
   * Grade an open-ended question using AI
   */
  private async gradeOpenEnded(
    question: OpenEndedQuestion,
    userAnswer: string,
  ): Promise<QuestionResult> {
    if (!userAnswer || userAnswer.trim().length === 0) {
      return {
        questionId: question.id,
        correct: false,
        userAnswer,
        feedback: 'No answer provided.',
      };
    }

    const prompt = this.buildGradingPrompt(question, userAnswer);

    try {
      const response = await this.anthropic.messages.create({
        model: this.config.get('anthropic.model'),
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = (response.content[0] as Anthropic.TextBlock).text;
      const gradingResult = this.parseGradingResult(rawText);

      return {
        questionId: question.id,
        correct: gradingResult.correct,
        userAnswer,
        feedback: gradingResult.feedback,
      };
    } catch (error) {
      this.logger.error('Failed to grade open-ended question', error);
      return {
        questionId: question.id,
        correct: false,
        userAnswer,
        feedback: 'Grading failed. Please try again.',
      };
    }
  }

  /**
   * Build the grading prompt for open-ended questions
   */
  private buildGradingPrompt(
    question: OpenEndedQuestion,
    userAnswer: string,
  ): string {
    return `You are an expert grader for Stacks blockchain and Bitcoin Layer 2 technology.

Grade the following student answer:

QUESTION: ${question.question}
${question.codeSnippet ? `\nCODE CONTEXT:\n${question.codeSnippet}` : ''}

MODEL ANSWER: ${question.modelAnswer}

STUDENT ANSWER: ${userAnswer}

GRADING CRITERIA:
- The answer doesn't need to match the model answer word-for-word
- Award credit for demonstrating understanding of key concepts
- Consider partial credit for partially correct answers
- Be fair but rigorous in your assessment

Return ONLY valid JSON in this format:
{
  "correct": true/false,
  "feedback": "Detailed feedback explaining why the answer is correct/incorrect and what could be improved"
}

Do not include markdown code blocks or any other text.`;
  }

  /**
   * Parse the AI grading response
   */
  private parseGradingResult(rawText: string): {
    correct: boolean;
    feedback: string;
  } {
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    try {
      const parsed = JSON.parse(cleanedText);
      return {
        correct: parsed.correct === true,
        feedback: parsed.feedback || 'No feedback provided.',
      };
    } catch (error) {
      this.logger.error('Failed to parse grading result', error);
      return {
        correct: false,
        feedback: 'Unable to grade this answer. Please try again.',
      };
    }
  }
}
