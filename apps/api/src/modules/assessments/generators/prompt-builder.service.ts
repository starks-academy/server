import { Injectable } from '@nestjs/common';
import { QuizFormatDto } from '../dto/generate-quiz.dto';

/**
 * Service responsible for building AI prompts for quiz generation
 */
@Injectable()
export class PromptBuilderService {
  /**
   * Build the generation prompt based on quiz configuration
   */
  buildGenerationPrompt(
    topic: string,
    format: QuizFormatDto,
    includeAdvanced: boolean,
  ): string {
    const basePrompt = this.getBasePrompt(topic);
    const formatInstructions = this.getFormatInstructions(format);
    const difficultyInstructions = this.getDifficultyInstructions(includeAdvanced);
    const jsonSchema = this.getJsonSchema(format);

    return `${basePrompt}

${formatInstructions}

${difficultyInstructions}

${jsonSchema}

IMPORTANT: Return ONLY valid JSON. Do not include markdown code blocks, explanations, or any other text.`;
  }

  private getBasePrompt(topic: string): string {
    return `You are an expert quiz generator for Stacks blockchain and Bitcoin Layer 2 technology.

Generate a quiz with 5 high-quality questions about: "${topic}"

Each question should:
- Be clear and unambiguous
- Test understanding, not just memorization
- Include detailed explanations for learning
- Be relevant to Stacks/Bitcoin development`;
  }

  private getFormatInstructions(format: QuizFormatDto): string {
    switch (format) {
      case QuizFormatDto.MULTI_CHOICE:
        return `FORMAT: All questions must be multiple-choice.
- Each question must have exactly 4 options (labeled a, b, c, d)
- Only one option should be correct
- Incorrect options should be plausible but clearly wrong
- Include code snippets where relevant`;

      case QuizFormatDto.OPEN_ENDED:
        return `FORMAT: All questions must be open-ended.
- Questions should require written explanations
- Include a comprehensive model answer for grading
- Questions should test deeper understanding
- Include code snippets where relevant`;

      case QuizFormatDto.MIXED:
        return `FORMAT: Mix multiple-choice and open-ended questions.
- Include 3 multiple-choice questions (with 4 options each)
- Include 2 open-ended questions (with model answers)
- Alternate between types for variety
- Include code snippets where relevant`;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private getDifficultyInstructions(includeAdvanced: boolean): string {
    if (includeAdvanced) {
      return `DIFFICULTY: Advanced
- Questions should challenge experienced developers
- Include edge cases and advanced concepts
- Test deep understanding of Stacks architecture
- Include complex code examples`;
    }

    return `DIFFICULTY: Beginner-friendly
- Questions should be accessible to newcomers
- Focus on fundamental concepts
- Use clear, simple language
- Include basic code examples`;
  }

  private getJsonSchema(format: QuizFormatDto): string {
    const multipleChoiceSchema = `{
  "id": "unique-id",
  "type": "multiple-choice",
  "question": "Question text",
  "codeSnippet": "optional code example",
  "options": [
    { "id": "a", "text": "Option A text" },
    { "id": "b", "text": "Option B text" },
    { "id": "c", "text": "Option C text" },
    { "id": "d", "text": "Option D text" }
  ],
  "correctOptionId": "a",
  "explanation": "Detailed explanation of the correct answer"
}`;

    const openEndedSchema = `{
  "id": "unique-id",
  "type": "open-ended",
  "question": "Question text",
  "codeSnippet": "optional code example",
  "modelAnswer": "Comprehensive model answer for grading",
  "explanation": "Detailed explanation and key points to look for"
}`;

    let schemaText = 'JSON SCHEMA:\n';

    if (format === QuizFormatDto.MULTI_CHOICE) {
      schemaText += `Return an array of questions following this schema:\n${multipleChoiceSchema}`;
    } else if (format === QuizFormatDto.OPEN_ENDED) {
      schemaText += `Return an array of questions following this schema:\n${openEndedSchema}`;
    } else {
      schemaText += `Return an array of questions. Multiple-choice questions follow:\n${multipleChoiceSchema}\n\nOpen-ended questions follow:\n${openEndedSchema}`;
    }

    return schemaText;
  }
}
