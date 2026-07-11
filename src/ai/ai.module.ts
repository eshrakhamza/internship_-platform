import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}