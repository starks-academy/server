import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum PracticeModule {
  BITCOIN_FUNDAMENTALS = 1,
  INTRODUCTION_TO_STACKS = 2,
  CLARITY_SMART_CONTRACTS = 3,
  BUILD_DAPPS = 4,
  ADVANCED_SMART_CONTRACT_PATTERNS = 5,
  BUILD_REAL_PROJECTS = 6,
  GENERAL = 0, // Random questions from all modules
}

export enum PracticeQuizFormat {
  MULTIPLE_CHOICE = 'multiple-choice',
  OPEN_ENDED = 'open-ended',
  MIXED = 'mixed',
}

export class GeneratePracticeQuizDto {
  @ApiProperty({
    enum: PracticeModule,
    description: 'Module to practice (0 for general/random from all modules)',
    default: PracticeModule.GENERAL,
  })
  @IsEnum(PracticeModule)
  module: PracticeModule = PracticeModule.GENERAL;

  @ApiProperty({
    enum: PracticeQuizFormat,
    description: 'Format of the quiz questions',
    default: PracticeQuizFormat.MIXED,
  })
  @IsEnum(PracticeQuizFormat)
  format: PracticeQuizFormat = PracticeQuizFormat.MIXED;

  @ApiProperty({
    description: 'Number of questions to generate',
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  questionCount?: number = 5;
}
