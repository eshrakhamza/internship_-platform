import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { Theme } from '@prisma/client';

export class UpdatePostingDto {
  @ApiProperty({ description: 'Internship title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Internship description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Theme, description: 'Theme', required: false })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiProperty({ description: 'Required skills', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiProperty({ description: 'Preferred skills', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @ApiProperty({ description: 'Start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Number of positions', required: false })
  @IsOptional()
  positions?: number;

  @ApiProperty({ description: 'Location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Is remote', required: false })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @ApiProperty({ description: 'Status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;
}