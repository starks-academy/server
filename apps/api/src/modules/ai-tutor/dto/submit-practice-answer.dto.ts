import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SubmitPracticeAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'User answer (option ID for MC, text for open-ended)' })
  @IsString()
  @MinLength(1)
  answer: string;

  @ApiProperty({ description: 'Question text for context' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Question type' })
  @IsString()
  questionType: string;
}
