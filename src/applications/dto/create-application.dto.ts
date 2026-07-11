import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max, Length } from 'class-validator';
import { Theme } from '@prisma/client';

export class CreateApplicationDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'MIT', description: 'School/University' })
  @IsString()
  @IsOptional()
  school?: string;

  @ApiProperty({ example: 'Masters', description: 'Academic level' })
  @IsString()
  @IsOptional()
  academicLevel?: string;

  @ApiProperty({ example: 2026, description: 'Graduation year' })
  @IsNumber()
  @IsOptional()
  @Min(2020)
  @Max(2030)
  graduationYear?: number;

  @ApiProperty({ enum: Theme, description: 'Preferred theme' })
  @IsEnum(Theme)
  @IsOptional()
  preferredTheme?: Theme;

  @ApiProperty({ example: 'I know your company from...', description: 'Answer to question 1' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  answerQuestion1: string;

  @ApiProperty({ example: 'AI interests me because...', description: 'Answer to question 2' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  answerQuestion2: string;

  @ApiProperty({ example: 'I am motivated by...', description: 'Answer to question 3' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  answerQuestion3: string;

  @ApiProperty({ example: 'I worked on a project...', description: 'Answer to question 4' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 5000)
  answerQuestion4: string;

  @ApiProperty({ example: 'I faced a challenge...', description: 'Answer to question 5' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 3000)
  answerQuestion5: string;

  @ApiProperty({ example: 'I want to improve...', description: 'Answer to question 6' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  answerQuestion6: string;
}