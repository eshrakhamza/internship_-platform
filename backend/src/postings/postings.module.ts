import { Module } from '@nestjs/common';
import { PostingsController } from './postings.controller';
import { PostingsService } from './postings.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [PrismaModule,HttpModule ],
  controllers: [PostingsController],
  providers: [PostingsService],
  exports: [PostingsService],
})
export class PostingsModule {}