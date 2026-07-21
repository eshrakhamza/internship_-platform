import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { Theme, Difficulty } from '@prisma/client';

export class CreatePostingDto {
  @ApiProperty({ description: 'Internship title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Internship description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: Theme, description: 'Theme' })
  @IsEnum(Theme)
  theme: Theme;

  @ApiProperty({ description: 'Required skills' })
  @IsArray()
  @IsString({ each: true })
  requiredSkills: string[];

  @ApiProperty({ description: 'Preferred skills' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Number of positions' })
  @IsOptional()
  positions?: number;

  @ApiProperty({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Is remote' })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @ApiProperty({ description: 'Status' })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;
}