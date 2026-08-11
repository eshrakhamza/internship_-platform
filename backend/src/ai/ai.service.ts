import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiServiceClient } from './ai-service.client';


@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiServiceClient: AiServiceClient,
  ) {
    this.logger.log('AI service initialized — using FastAPI/Groq backend');
  }

  async analyzeApplication(applicationId: string) {
    this.logger.log(`Analyzing application: ${applicationId}`);

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: {
            user: true,
            cvData: true, // pulls in extracted/structured CV data, if any
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    const existingAnalysis = await this.prisma.aIAnalysis.findUnique({
      where: { applicationId },
    });

    if (existingAnalysis) {
      this.logger.log(`AI analysis already exists for application: ${applicationId}`);
      return existingAnalysis;
    }

    try {
      this.logger.log('Generating AI analysis via FastAPI/Groq (CV + answers combined)...');

      const cv = application.candidate.cvData;

      const result = await this.aiServiceClient.analyzeApplication({
        candidateName: `${application.candidate.user.firstName} ${application.candidate.user.lastName}`,
        school: application.candidate.school ?? undefined,
        academicLevel: application.candidate.academicLevel ?? undefined,
        preferredTheme: application.candidate.preferredTheme ?? undefined,
        answers: [
          application.answerQuestion1,
          application.answerQuestion2,
          application.answerQuestion3,
          application.answerQuestion4,
          application.answerQuestion5,
          application.answerQuestion6,
        ],
        cvSummary: cv?.summary ?? undefined,
        cvSkills: cv?.skills ?? [],
        cvExperience: (cv?.experience as any[]) ?? [],
        cvProjects: (cv?.projects as any[]) ?? [],   // ← add
        cvEducation: (cv?.education as any[]) ?? [],
      });

      this.logger.log(`Analysis received — score: ${result.score}, theme: ${result.theme}`);

      const savedAnalysis = await this.prisma.aIAnalysis.create({
        data: {
          applicationId: applicationId,
          candidateId: application.candidate.id,
          candidateSummary: result.summary,
          themeClassification: result.theme as any,
          recommendationScore: result.score,
          recommendationExplanation: result.explanation,
        },
      });

      this.logger.log(`AI analysis saved for application: ${applicationId}`);
      return savedAnalysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI analysis failed: ${errorMessage}`);
      return this.createFallbackAnalysis(application);
    }
  }

  private createFallbackAnalysis(application: any): any {
    this.logger.log(`Creating fallback analysis for application: ${application.id}`);

    return {
      id: 'fallback-' + Date.now(),
      applicationId: application.id,
      candidateId: application.candidate.id,
      candidateSummary: 'Candidate submitted a complete application with detailed responses about their experience and skills.',
      themeClassification: application.candidate.preferredTheme || 'FULL_STACK',
      recommendationScore: 70,
      recommendationExplanation: 'Application shows good effort and relevant skills. Manual review recommended for final decision.',
      generatedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async analyzeAllPendingApplications() {
    const applications = await this.prisma.application.findMany({
      where: {
        aiAnalyses: {
          none: {},
        },
      },
      include: {
        candidate: {
          include: {
            user: true,
            cvData: true,
          },
        },
      },
    });

    this.logger.log(`Found ${applications.length} applications without AI analysis`);

    const results: Array<{
      applicationId: string;
      status: string;
      analysis?: any;
      error?: string;
    }> = [];

    for (const app of applications) {
      try {
        const analysis = await this.analyzeApplication(app.id);
        results.push({
          applicationId: app.id,
          status: 'success',
          analysis,
        });
        this.logger.log(`Successfully analyzed application: ${app.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to analyze application ${app.id}: ${errorMessage}`);
        results.push({
          applicationId: app.id,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    return results;
  }
}