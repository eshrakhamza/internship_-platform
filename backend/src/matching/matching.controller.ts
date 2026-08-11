// src/matching/matching.controller.ts
import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('jobs/:jobId/matches')
  async triggerMatch(@Param('jobId') jobId: string, @Query('limit') limit = '5') {
    return this.matchingService.enqueueMatchRun(jobId, Number(limit));
  }

  @Get('match-runs/:matchRunId')
  async getMatchRun(@Param('matchRunId') matchRunId: string) {
    return this.matchingService.getMatchRun(matchRunId);
  }
  // matching.controller.ts — new endpoint
@Get('jobs/:jobId/latest-match')
async getLatestMatch(@Param('jobId') jobId: string) {
  return this.matchingService.getLatestMatchRun(jobId);
}
}