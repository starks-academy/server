import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class SubmitAnswersDto {
  @ApiProperty({
    type: 'object',
    description: 'Map of question IDs to user answers',
    example: {
      'q1': 'a',
      'q2': 'This is my answer to the open-ended question',
    },
  })
  @IsObject()
  answers: Record<string, string>;
}
