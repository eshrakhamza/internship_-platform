// src/matching/matching.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchingService } from './matching.service';
import { MatchingProcessor } from './matching.processor';
import { MatchingController } from './matching.controller';
import { AiServiceModule } from '../ai/ai-service.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MATCHING_QUEUE } from './matching.constants';

@Module({
  imports: [
    AiServiceModule,   // ← provides properly-configured AiServiceClient (with baseURL)
    PrismaModule,
    BullModule.registerQueue({ name: MATCHING_QUEUE }),
  ],
  providers: [MatchingService, MatchingProcessor],
  controllers: [MatchingController],
})
export class MatchingModule {}