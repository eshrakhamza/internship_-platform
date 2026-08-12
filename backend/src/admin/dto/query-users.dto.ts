import { IsOptional, IsEnum, IsBooleanString, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class QueryUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsString()
  search?: string; // matches email, firstName, lastName
}