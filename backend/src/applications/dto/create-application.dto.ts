// backend/src/applications/dto/create-application.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsInt, 
  Min, 
  Max, 
  IsEmail, 
  IsEnum 
} from 'class-validator';
import { Theme } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty({ message: 'firstName should not be empty' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'lastName should not be empty' })
  lastName: string;

  @IsEmail({}, { message: 'email must be an email' })
  @IsNotEmpty({ message: 'email should not be empty' })
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty({ message: 'school should not be empty' })
  school: string;

  @IsString()
  @IsNotEmpty({ message: 'academicLevel should not be empty' })
  academicLevel: string;

  @IsInt()
  @Min(1900, { message: 'graduationYear must not be less than 1900' })
  @Max(2100, { message: 'graduationYear must not be greater than 2100' })
  @IsNotEmpty({ message: 'graduationYear should not be empty' })
  graduationYear: number;

  @IsEnum(Theme, { 
    message: 'preferredTheme must be one of the following values: ARTIFICIAL_INTELLIGENCE, CYBERSECURITY, DEVOPS, DATA_SCIENCE, FULL_STACK, CLOUD_COMPUTING, SOFTWARE_ENGINEERING' 
  })
  @IsNotEmpty({ message: 'preferredTheme should not be empty' })
  preferredTheme: Theme;

  @IsString()
  @IsNotEmpty({ message: 'answerQuestion1 should not be empty' })
  answerQuestion1: string;

  @IsString()
  @IsNotEmpty({ message: 'answerQuestion2 should not be empty' })
  answerQuestion2: string;

  @IsString()
  @IsNotEmpty({ message: 'answerQuestion3 should not be empty' })
  answerQuestion3: string;

  @IsString()
  @IsNotEmpty({ message: 'answerQuestion4 should not be empty' })
  answerQuestion4: string;

  @IsString()
  @IsNotEmpty({ message: 'answerQuestion5 should not be empty' })
  answerQuestion5: string;

  @IsString()
  @IsNotEmpty({ message: 'answerQuestion6 should not be empty' })
  answerQuestion6: string;
}