import { Controller, Post, Param, NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/applications/:applicationId/analyze
   * Triggers (or returns cached) AI analysis for a given application.
   * Returns the real AIAnalysis shape — candidateSummary, themeClassification,
   * recommendationScore, recommendationExplanation — not invented fields.
   */
  @Post('applications/:applicationId/analyze')
  async analyzeApplication(@Param('applicationId') applicationId: string) {
    try {
      return await this.aiService.analyzeApplication(applicationId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Application not found') {
        throw new NotFoundException('Application not found');
      }
      throw error;
    }
  }
}