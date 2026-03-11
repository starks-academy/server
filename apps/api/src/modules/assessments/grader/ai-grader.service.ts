import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { QuizSession } from '@app/database/entities/quiz-session.entity';

@Injectable()
export class AiGraderService {
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({ apiKey: this.config.get('anthropic.apiKey') });
  }

  async grade(session: QuizSession, answers: string[]) {
    const questions = session.questions as any[];

    const gradingPrompt = questions
      .map((q, i) => `Q${i + 1}: ${q.question}\nStudent Answer: ${answers[i]}\nCorrect Answer: ${q.correctAnswer}`)
      .join('\n\n');

    const response = await this.anthropic.messages.create({
      model: this.config.get('anthropic.model'),
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Grade these quiz answers. For each question, determine if the student's answer is correct or substantially correct.
Return ONLY valid JSON: { "score": 0-100, "results": [{ "correct": boolean, "feedback": string }] }

${gradingPrompt}`,
        },
      ],
    });

    try {
      return JSON.parse((response.content[0] as Anthropic.TextBlock).text);
    } catch {
      // Fallback scoring if parsing fails
      return { score: 0, results: questions.map(() => ({ correct: false, feedback: 'Grading failed' })) };
    }
  }
}
