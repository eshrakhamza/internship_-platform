import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
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
    private readonly aiService: AiService,
    private readonly emailService: EmailService,
  ) {}

  // Create a new assessment with AI-generated questions
  async create(userId: string, createDto: CreateAssessmentDto) {
    this.logger.log(`Creating assessment for user: ${userId}`);

    // Generate questions using AI
    let questions: CreateQuestionDto[] = createDto.questions || [];

    if (!questions.length) {
      // Generate questions with AI
      questions = await this.generateQuestionsWithAI(
        createDto.theme,
        createDto.difficulty,
        createDto.mcqCount || 10,
        createDto.openCount || 2,
      );
    }

    // Create assessment with questions
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

  // Generate questions using AI
  private async generateQuestionsWithAI(
    theme: Theme,
    difficulty: Difficulty,
    mcqCount: number,
    openCount: number,
  ): Promise<CreateQuestionDto[]> {
    this.logger.log(`Generating ${mcqCount} MCQ and ${openCount} open questions with AI...`);

    const prompt = `
      Generate ${mcqCount} multiple choice questions and ${openCount} open-ended questions 
      for a ${difficulty} level internship assessment on the theme: ${theme}.
      
      For each MCQ question, provide:
      - Question text
      - 4 options (one correct, three incorrect)
      - Explanation for the correct answer
      
      For each open question, provide:
      - Question text
      - Expected approach/skills to look for
      
      Format as JSON:
      {
        "mcqs": [
          {
            "question": "What is...?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0,
            "explanation": "..."
          }
        ],
        "opens": [
          {
            "question": "Describe...",
            "expectedSkills": "..."
          }
        ]
      }
    `;

    try {
      const response = await this.aiService.callOllama(prompt);
      const parsed = this.parseAIResponse(response);
      return this.convertToQuestions(parsed);
    } catch (error) {
      this.logger.error(`AI question generation failed: ${error.message}`);
      // Return default questions if AI fails
      return this.getDefaultQuestions(theme, difficulty, mcqCount, openCount);
    }
  }

  private parseAIResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
    }
    return null;
  }

  private convertToQuestions(parsed: any): CreateQuestionDto[] {
    const questions: CreateQuestionDto[] = [];

    if (parsed?.mcqs) {
      for (const mcq of parsed.mcqs) {
        questions.push({
          type: 'MCQ',
          questionText: mcq.question,
          explanation: mcq.explanation,
          options: mcq.options.map((opt: string, index: number) => ({
            optionText: opt,
            isCorrect: index === mcq.correctAnswer,
          })),
        });
      }
    }

    if (parsed?.opens) {
      for (const open of parsed.opens) {
        questions.push({
          type: 'OPEN',
          questionText: open.question,
          explanation: open.expectedSkills,
        });
      }
    }

    return questions;
  }

  private getDefaultQuestions(theme: Theme, difficulty: Difficulty, mcqCount: number, openCount: number): CreateQuestionDto[] {
    const questions: CreateQuestionDto[] = [];
    
    // Default MCQ questions
    for (let i = 0; i < mcqCount; i++) {
      questions.push({
        type: 'MCQ',
        questionText: `Sample MCQ question ${i + 1} about ${theme} (${difficulty} level)`,
        options: [
          { optionText: 'Option A', isCorrect: i === 0 },
          { optionText: 'Option B', isCorrect: false },
          { optionText: 'Option C', isCorrect: false },
          { optionText: 'Option D', isCorrect: false },
        ],
        explanation: 'This is a sample explanation.',
      });
    }

    for (let i = 0; i < openCount; i++) {
      questions.push({
        type: 'OPEN',
        questionText: `Describe your experience with ${theme} and how you would approach solving a complex problem in this domain.`,
        explanation: 'Look for specific examples, problem-solving approach, and technical depth.',
      });
    }

    return questions;
  }

  // Get all assessments
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

  // Get assessment by ID
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

  // Update assessment
// Update assessment
async update(id: string, updateDto: UpdateAssessmentDto) {
    const assessment = await this.findOne(id);
  
    if (assessment.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Cannot update a published assessment');
    }
  
    // Build update data with only the fields that are provided
    const updateData: any = {};
    
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.theme !== undefined) updateData.theme = updateDto.theme;
    if (updateDto.difficulty !== undefined) updateData.difficulty = updateDto.difficulty;
    if (updateDto.durationMinutes !== undefined) updateData.durationMinutes = updateDto.durationMinutes;
  
    // If questions are provided, handle them separately
    // Note: For simplicity, we're not updating questions in this version
    // You can add question update logic here if needed
  
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
  // Publish assessment and invite candidates
  async publish(id: string, publishDto: PublishAssessmentDto) {
    const assessment = await this.findOne(id);

    if (assessment.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Assessment is already published');
    }

    // Update assessment status
    const published = await this.prisma.assessmentCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Create attempts for each invited candidate
    for (const candidateId of publishDto.candidateIds) {
      await this.prisma.attempt.create({
        data: {
          candidateId,
          campaignId: id,
          startedAt: new Date(),
        },
      });

      // Get candidate email
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { user: true },
      });

      if (candidate) {
        // Send invitation email
        await this.emailService.sendTestInvitationEmail(
          candidate.user.email,
          `${candidate.user.firstName} ${candidate.user.lastName}`,
          assessment.title,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days deadline
        );
      }
    }

    this.logger.log(`Assessment ${id} published with ${publishDto.candidateIds.length} candidates`);
    return published;
  }

  // Delete assessment
  async delete(id: string) {
    const assessment = await this.findOne(id);

    if (assessment.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete a published assessment');
    }

    return this.prisma.assessmentCampaign.delete({
      where: { id },
    });
  }

  // Get assessment results
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
}