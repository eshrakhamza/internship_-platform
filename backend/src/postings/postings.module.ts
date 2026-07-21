import { Module } from '@nestjs/common';
import { PostingsController } from './postings.controller';
import { PostingsService } from './postings.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostingsController],
  providers: [PostingsService],
  exports: [PostingsService],
})
export class PostingsModule {}