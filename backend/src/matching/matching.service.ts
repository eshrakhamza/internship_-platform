// src/matching/matching.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { MATCHING_QUEUE, MATCH_JOB_POSTING } from './matching.constants';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(MATCHING_QUEUE) private readonly matchingQueue: Queue,
  ) {}

  async enqueueMatchRun(jobPostingId: string, topN = 5) {
    const matchRun = await this.prisma.matchRun.create({
      data: { jobId: jobPostingId, status: 'pending' },
    });

    await this.matchingQueue.add(
      MATCH_JOB_POSTING,
      { matchRunId: matchRun.id, jobPostingId, topN },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    return { matchRunId: matchRun.id, status: matchRun.status };
  }

  async getMatchRun(matchRunId: string) {
    const run = await this.prisma.matchRun.findUniqueOrThrow({
      where: { id: matchRunId },
      include: {
        results: {
          orderBy: { rank: 'asc' },
          include: {
            candidate: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
  
    return {
      ...run,
      results: run.results.map((r) => ({
        ...r,
        candidate: {
          id: r.candidate.id,
          fullName: `${r.candidate.user.firstName} ${r.candidate.user.lastName}`,
        },
      })),
    };
  }
  // matching.service.ts — new method
  async getLatestMatchRun(jobId: string) {
    const run = await this.prisma.matchRun.findFirst({
      where: { jobId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          orderBy: { rank: 'asc' },
          include: {
            candidate: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
  
    if (!run) return null;
  
    return {
      ...run,
      results: run.results.map((r) => ({
        ...r,
        candidate: {
          id: r.candidate.id,
          fullName: `${r.candidate.user.firstName} ${r.candidate.user.lastName}`,
        },
      })),
    };
  }
}