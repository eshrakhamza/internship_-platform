import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Theme, Difficulty } from '@prisma/client';

export class CreateQuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  questionText: string;

  @ApiProperty({ enum: ['MCQ', 'OPEN'], description: 'Question type' })
  @IsEnum(['MCQ', 'OPEN'])
  type: string;

  @ApiProperty({ required: false, description: 'Explanation for MCQ' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ required: false, description: 'Reference answer for AI grading (OPEN questions only)' })
  @IsOptional()
  @IsString()
  expectedAnswer?: string;

  @ApiProperty({ required: false, description: 'MCQ options' })
  @IsOptional()
  @IsArray()
  options?: { optionText: string; isCorrect: boolean }[];
}

export class CreateAssessmentDto {
  @ApiProperty({ description: 'Assessment title' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, description: 'Assessment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Theme, description: 'Theme' })
  @IsEnum(Theme)
  theme: Theme;

  @ApiProperty({ enum: Difficulty, description: 'Difficulty level' })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(5)
  @Max(180)
  durationMinutes: number;

  @ApiProperty({ required: false, description: 'Number of MCQ questions to generate' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  mcqCount?: number;

  @ApiProperty({ required: false, description: 'Number of open questions to generate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  openCount?: number;

  @ApiProperty({ required: false, description: 'Custom questions' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}