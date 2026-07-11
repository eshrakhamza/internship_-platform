import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class PublishAssessmentDto {
  @ApiProperty({ description: 'Array of candidate user IDs to invite' })
  @IsArray()
  @IsUUID('all', { each: true })
  candidateIds: string[];
}