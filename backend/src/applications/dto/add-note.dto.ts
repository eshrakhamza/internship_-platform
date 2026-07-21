import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum NoteCategory {
  GENERAL = 'GENERAL',
  STRENGTH = 'STRENGTH',
  WEAKNESS = 'WEAKNESS',
  OBSERVATION = 'OBSERVATION',
}

export class AddNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  content: string;

  @ApiProperty({ enum: NoteCategory, description: 'Note category', required: false })
  @IsOptional()
  @IsEnum(NoteCategory)
  category?: NoteCategory;
}