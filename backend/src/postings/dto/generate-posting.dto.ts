// postings/dto/generate-posting.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class GeneratePostingDto {
  @IsString()
  title: string;

  @IsString()
  roughInput: string;

  @IsOptional()
  @IsString()
  seniority?: string;

  @IsOptional()
  @IsString()
  department?: string;
}