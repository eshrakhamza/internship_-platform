import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateQuestionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expectedAnswer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  options?: { optionText: string; isCorrect: boolean }[];
}