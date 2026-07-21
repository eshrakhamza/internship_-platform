import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateAssessmentDto, CreateQuestionDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { PublishAssessmentDto } from './dto/publish-assessment.dto';
import { Difficulty, Theme, CampaignStatus, QuestionType } from '@prisma/client';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Create a new assessment
  async create(userId: string, createDto: CreateAssessmentDto) {
    this.logger.log(`Creating assessment for user: ${userId}`);

    let questions: CreateQuestionDto[] = createDto.questions || [];

    if (!questions.length) {
      // ============================================
      // TODO: AI Question Generation (Future FastAPI Microservice)
      // POST /api/ai/generate-questions
      // ============================================
      questions = this.getDefaultQuestions(
        createDto.theme,
        createDto.difficulty,
        createDto.mcqCount || 5,
        createDto.openCount || 2,
      );
    }

    const assessment = await this.prisma.assessmentCampaign.create({
      data: {
        title: createDto.title,
        description: createDto.description,
        theme: createDto.theme,
        difficulty: createDto.difficulty,
        durationMinutes: createDto.durationMinutes,
        createdBy: userId,
        status: CampaignStatus.DRAFT,
        questions: {
          create: questions.map((q, index) => ({
            type: q.type === 'OPEN' ? QuestionType.OPEN : QuestionType.MCQ,
            questionText: q.questionText,
            explanation: q.explanation,
            order: index,
            options: q.options ? {
              create: q.options.map((opt, optIndex) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                order: optIndex,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    this.logger.log(`Assessment created: ${assessment.id}`);
    return assessment;
  }

  private getDefaultQuestions(
    theme: Theme, 
    difficulty: Difficulty, 
    mcqCount: number, 
    openCount: number
  ): CreateQuestionDto[] {
    const questions: CreateQuestionDto[] = [];
    
    const mcqTopics = [
      `What is the fundamental concept of ${theme}?`,
      `Which of the following is a key principle in ${theme}?`,
      `What is the main purpose of ${theme}?`,
      `Which technology is commonly used in ${theme}?`,
      `What is the best practice for implementing ${theme}?`
    ];

    for (let i = 0; i < Math.min(mcqCount, mcqTopics.length); i++) {
      questions.push({
        type: 'MCQ',
        questionText: mcqTopics[i % mcqTopics.length],
        options: [
          { optionText: 'Option A - Correct', isCorrect: i === 0 },
          { optionText: 'Option B', isCorrect: false },
          { optionText: 'Option C', isCorrect: false },
          { optionText: 'Option D', isCorrect: false },
        ],
        explanation: 'This is a sample explanation for the correct answer.',
      });
    }

    const openTopics = [
      `Describe your experience with ${theme} and how you would approach solving a complex problem in this domain.`,
      `Explain the importance of ${theme} in modern software development.`,
      `What are the challenges in implementing ${theme} and how would you overcome them?`
    ];

    for (let i = 0; i < Math.min(openCount, openTopics.length); i++) {
      questions.push({
        type: 'OPEN',
        questionText: openTopics[i % openTopics.length],
        explanation: 'Look for specific examples, problem-solving approach, and technical depth.',
      });
    }

    return questions;
  }

  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    const [assessments, total] = await Promise.all([
      this.prisma.assessmentCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      }),
      this.prisma.assessmentCampaign.count({ where }),
    ]);

    return {
      data: assessments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessmentCampaign.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        attempts: {
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
            answers: true,
            result: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  async update(id: string, updateDto: UpdateAssessmentDto) {
    const assessment = await this.findOne(id);
  
    if (assessment.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Cannot update a published assessment');
    }
  
    const updateData: any = {};
    
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.theme !== undefined) updateData.theme = updateDto.theme;
    if (updateDto.difficulty !== undefined) updateData.difficulty = updateDto.difficulty;
    if (updateDto.durationMinutes !== undefined) updateData.durationMinutes = updateDto.durationMinutes;
  
    return this.prisma.assessmentCampaign.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  async publish(id: string, publishDto: PublishAssessmentDto) {
    const assessment = await this.findOne(id);

    if (assessment.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Assessment is already published');
    }

    const published = await this.prisma.assessmentCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    for (const candidateId of publishDto.candidateIds) {
      await this.prisma.attempt.create({
        data: {
          candidateId,
          campaignId: id,
        },
      });

      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { user: true },
      });

      if (candidate) {
        await this.emailService.sendTestInvitationEmail(
          candidate.user.email,
          `${candidate.user.firstName} ${candidate.user.lastName}`,
          assessment.title,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        );
      }
    }

    this.logger.log(`Assessment ${id} published with ${publishDto.candidateIds.length} candidates`);
    return published;
  }

  async delete(id: string) {
    const assessment = await this.findOne(id);

    if (assessment.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete a published assessment');
    }

    return this.prisma.assessmentCampaign.delete({
      where: { id },
    });
  }

  async getResults(id: string) {
    const assessment = await this.findOne(id);

    const attempts = await this.prisma.attempt.findMany({
      where: { campaignId: id },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        result: true,
        answers: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
      },
      orderBy: {
        totalScore: 'desc',
      },
    });

    return {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        theme: assessment.theme,
        difficulty: assessment.difficulty,
      },
      attempts: attempts.map(a => ({
        candidate: {
          id: a.candidate.id,
          name: `${a.candidate.user.firstName} ${a.candidate.user.lastName}`,
          email: a.candidate.user.email,
        },
        status: a.status,
        mcqScore: a.mcqScore,
        openQuestionsScore: a.openQuestionsScore,
        totalScore: a.totalScore,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        timeSpentSeconds: a.timeSpentSeconds,
      })),
    };
  }
  // Add to AssessmentsService

async getAvailableAssessments(userId: string) {
  const candidate = await this.prisma.candidate.findUnique({
    where: { userId },
  });

  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }

  // Get published assessments where candidate hasn't completed yet
  const assessments = await this.prisma.assessmentCampaign.findMany({
    where: {
      status: 'PUBLISHED',
      attempts: {
        none: {
          candidateId: candidate.id,
          status: 'COMPLETED',
        },
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return assessments;
}

async getAssessmentForTaking(assessmentId: string, userId: string) {
  const candidate = await this.prisma.candidate.findUnique({
    where: { userId },
  });

  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }

  // Get or create attempt
  let attempt = await this.prisma.attempt.findFirst({
    where: {
      candidateId: candidate.id,
      campaignId: assessmentId,
      status: 'IN_PROGRESS',
    },
  });

  if (!attempt) {
    // Check if already completed
    const completed = await this.prisma.attempt.findFirst({
      where: {
        candidateId: candidate.id,
        campaignId: assessmentId,
        status: 'COMPLETED',
      },
    });

    if (completed) {
      throw new BadRequestException('You have already completed this assessment');
    }

    // Create new attempt
    attempt = await this.prisma.attempt.create({
      data: {
        candidateId: candidate.id,
        campaignId: assessmentId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  // Get assessment with questions
  const assessment = await this.prisma.assessmentCampaign.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: 'asc' },
      },
      attempts: {
        where: {
          candidateId: candidate.id,
        },
      },
    },
  });

  if (!assessment) {
    throw new NotFoundException('Assessment not found');
  }

  return {
    ...assessment,
    attemptId: attempt.id,
    attemptStatus: attempt.status,
  };
}
}