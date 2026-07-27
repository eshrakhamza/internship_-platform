import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  [x: string]: any;
  // REMOVED: internshipPosting: any; - This is already defined in PrismaClient
  
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Optional: Clean database method (use with caution!)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Use the correct model names from Prisma
    const models = [
      'attemptAnswer',
      'attempt',
      'assessmentResult',
      'question',
      'mCQOption', // Note: Prisma generates this as mCQOption
      'assessmentCampaign',
      'aIAnalysis', // Note: Prisma generates this as aIAnalysis
      'recruiterNote',
      'statusHistory',
      'emailLog',
      'application',
      'candidate',
      'file',
      'user',
      'internshipPosting', // ← Add this since it exists in your schema
    ];

    for (const model of models) {
      try {
        await (this as any)[model].deleteMany();
      } catch (error) {
        // Model might not exist yet, skip
        console.log(`Skipping ${model} - not found`);
      }
    }
  }
}