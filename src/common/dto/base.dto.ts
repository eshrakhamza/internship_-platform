import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BaseDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  createdAt?: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  updatedAt?: Date;
}