/**
 * Question type definitions for the assessment system
 */

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  OPEN_ENDED = 'open-ended',
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  codeSnippet?: string;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionType.MULTIPLE_CHOICE;
  options: QuestionOption[];
  correctOptionId: string;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: QuestionType.OPEN_ENDED;
  modelAnswer: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export type Question = MultipleChoiceQuestion | OpenEndedQuestion;

export interface GeneratedQuiz {
  questions: Question[];
}
