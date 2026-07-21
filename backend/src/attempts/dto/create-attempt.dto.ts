import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateAttemptDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaignId: string;
}