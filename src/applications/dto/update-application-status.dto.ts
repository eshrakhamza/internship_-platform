import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus, description: 'New status' })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({ example: 'Candidate has strong technical skills', description: 'Notes about this status change' })
  @IsString()
  @IsOptional()
  notes?: string;
}