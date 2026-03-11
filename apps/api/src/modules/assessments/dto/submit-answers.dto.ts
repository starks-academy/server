import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SubmitAnswersDto {
  @ApiProperty({ type: [String], description: 'Array of answers in question order' })
  @IsArray()
  @IsString({ each: true })
  answers: string[];
}
