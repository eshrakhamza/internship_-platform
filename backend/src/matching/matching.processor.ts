// src/matching/matching.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiServiceClient } from '../ai/ai-service.client';
import { MATCHING_QUEUE } from './matching.constants';

interface MatchJobData {
  matchRunId: string;
  jobPostingId: string;
  topN: number;
}

interface ScoredCandidate {
  candidateId: string;
  cvSummary: string;
  similarityScore: number;
}

interface FinalMatchResult extends ScoredCandidate {
  explanation: string;
  rank: number;
}

@Processor(MATCHING_QUEUE)
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiServiceClient,
  ) {
    super();
  }

  async process(job: Job<MatchJobData>): Promise<void> {
    const { matchRunId, jobPostingId, topN } = job.data;

    await this.prisma.matchRun.update({
      where: { id: matchRunId },
      data: { status: 'processing' },
    });

    try {
      const jobPosting = await this.prisma.internshipPosting.findUniqueOrThrow({
        where: { id: jobPostingId },
      });

      // Scope candidates to this posting's theme — matching should rank
      // candidates who are actually interested in/relevant to this theme,
      // not the entire candidate pool regardless of specialization.
      const candidates = await this.prisma.candidate.findMany({
        where: {
          preferredTheme: jobPosting.theme,
          cvData: { embedding: { not: undefined } },
        },
        select: {
          id: true,
          cvData: { select: { embedding: true, summary: true, skills: true } },
        },
      });

      this.logger.log(
        `Found ${candidates.length} candidate(s) with theme=${jobPosting.theme} for posting ${jobPostingId}`,
      );

      const jobEmbedding = await this.aiClient.generateEmbedding(jobPosting.description);

      const scored: ScoredCandidate[] = candidates
        .filter((c) => c.cvData?.embedding)
        .map((c) => ({
          candidateId: c.id,
          cvSummary: c.cvData!.summary ?? c.cvData!.skills.join(', '),
          similarityScore: this.cosineSimilarity(
            jobEmbedding,
            c.cvData!.embedding as number[],
          ),
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, topN);

      await job.updateProgress(50);

      // Sequential, not Promise.all — avoids hammering Groq's rate limit
      const finalResults: FinalMatchResult[] = [];
      for (const [index, candidate] of scored.entries()) {
        const { explanation } = await this.aiClient.explainMatch(
          candidate.cvSummary,
          jobPosting.description,
          candidate.similarityScore,
        );
        finalResults.push({ ...candidate, explanation, rank: index + 1 });
        await job.updateProgress(50 + Math.round(((index + 1) / scored.length) * 50));
      }

      await this.prisma.$transaction([
        ...finalResults.map((r) =>
          this.prisma.matchResult.create({
            data: {
              matchRunId,
              candidateId: r.candidateId,
              similarityScore: r.similarityScore,
              explanation: r.explanation,
              rank: r.rank,
            },
          }),
        ),
        this.prisma.matchRun.update({
          where: { id: matchRunId },
          data: { status: 'completed', completedAt: new Date() },
        }),
      ]);
    } catch (err) {
      this.logger.error(`Match run ${matchRunId} failed: ${err.message}`);
      await this.prisma.matchRun.update({
        where: { id: matchRunId },
        data: { status: 'failed', error: err.message },
      });
      throw err; // let BullMQ retry logic handle it
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}