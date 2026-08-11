import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiServiceModule } from '../ai/ai-service.module';
@Module({
  imports: [PrismaModule, AiServiceModule],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}