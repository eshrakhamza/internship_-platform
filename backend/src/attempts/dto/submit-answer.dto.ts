import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ required: false, description: 'Selected option ID for MCQ' })
  @IsOptional()
  @IsUUID()
  selectedOptionId?: string;

  @ApiProperty({ required: false, description: 'Text answer for open questions' })
  @IsOptional()
  @IsString()
  openAnswer?: string;
}