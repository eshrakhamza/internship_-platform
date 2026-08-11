// src/applications/applications.service.ts
import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApplicationStatus, Theme } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { AiServiceClient } from '../ai/ai-service.client'; // adjust path to match your project
import * as fs from 'fs';
import { Prisma } from '@prisma/client'; // add this import at the top
import { AiService } from '../ai/ai.service'; // adjust path to match your project
@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);
  cvProcessingQueue: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly aiServiceClient: AiServiceClient,
    private readonly aiService: AiService, // ← add this
  ) {}

  async create(
    userId: string,
    createDto: CreateApplicationDto,
    cvFile?: any
  ) {
    this.logger.log(`Creating application for user: ${userId}`);
  
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { candidate: true },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      let candidate = user.candidate;
      if (!candidate) {
        candidate = await this.prisma.candidate.create({
          data: { userId: userId },
        });
        this.logger.log(`Candidate created: ${candidate.id}`);
      }
  
      const existingApplication = await this.prisma.application.findUnique({
        where: { candidateId: candidate.id },
      });
  
      if (existingApplication) {
        throw new HttpException('You have already submitted an application', HttpStatus.CONFLICT);
      }
  
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          phoneNumber: createDto.phoneNumber,
        },
      });
  
      await this.prisma.candidate.update({
        where: { userId },
        data: {
          school: createDto.school,
          academicLevel: createDto.academicLevel,
          graduationYear: createDto.graduationYear,
          preferredTheme: createDto.preferredTheme,
        },
      });
  
      // Save CV file if uploaded, then extract + structure it
      let cvFileId: string | null = null;
      if (cvFile) {
        try {
          const fileRecord = await this.prisma.file.create({
            data: {
              filename: cvFile.filename || '',
              originalName: cvFile.originalname || '',
              mimeType: cvFile.mimetype || '',
              path: cvFile.path || '',
              size: cvFile.size || 0,
            },
          });
          cvFileId = fileRecord.id;
  
          await this.prisma.candidate.update({
            where: { userId },
            data: { cvFileId: cvFileId },
          });
  
          // --- CV extraction + structuring, synchronous ---
          try {
            const pdfBuffer = cvFile.buffer ?? fs.readFileSync(cvFile.path);
  
            const extraction = await this.aiServiceClient.extractCv(
              pdfBuffer,
              cvFile.originalname || cvFile.filename,
            );
            this.logger.log(
              `CV extracted via ${extraction.method}, ${extraction.text.length} chars`,
            );
  
            const structured = await this.aiServiceClient.structureCv(extraction.text);
            this.logger.log(`CV structured — skills: ${structured.skills?.length ?? 0}`);
  
            await this.prisma.candidateCV.upsert({
              where: { candidateId: candidate.id },
              create: {
                candidateId: candidate.id,
                fileId: cvFileId,
                rawText: extraction.text,
                extractionMethod: extraction.method,
                fullName: structured.full_name,
                email: structured.email,
                phone: structured.phone,
                skills: structured.skills ?? [],
                experience: (structured.experience ?? []) as unknown as Prisma.InputJsonValue,
                education: (structured.education ?? []) as unknown as Prisma.InputJsonValue,
                projects: (structured.projects ?? []) as unknown as Prisma.InputJsonValue,
                languages: structured.languages ?? [],
                summary: structured.summary,
              },
              update: {
                fileId: cvFileId,
                rawText: extraction.text,
                extractionMethod: extraction.method,
                fullName: structured.full_name,
                email: structured.email,
                phone: structured.phone,
                skills: structured.skills ?? [],
                experience: (structured.experience ?? []) as unknown as Prisma.InputJsonValue,
                education: (structured.education ?? []) as unknown as Prisma.InputJsonValue,
                projects: (structured.projects ?? []) as unknown as Prisma.InputJsonValue,
                languages: structured.languages ?? [],
                summary: structured.summary,
              },
            });
  
            this.logger.log(`CandidateCV saved for candidate: ${candidate.id}`);
  
            // --- NEW: generate + persist embedding for matching, right after structuring ---
            try {
              const embeddingText =
                structured.summary ??
                [
                  structured.skills?.join(', '),
                  ...(structured.projects ?? []).map((p) => p?.description).filter(Boolean),
                ]
                  .filter(Boolean)
                  .join('. ');
  
              if (embeddingText) {
                const vector = await this.aiServiceClient.generateEmbedding(embeddingText);
                await this.prisma.candidateCV.update({
                  where: { candidateId: candidate.id },
                  data: { embedding: vector },
                });
                this.logger.log(`Embedding generated and saved for candidate: ${candidate.id}`);
              } else {
                this.logger.warn(
                  `No usable text to embed for candidate: ${candidate.id} — skipping embedding`,
                );
              }
            } catch (embeddingError: any) {
              // Don't fail the whole application if embedding generation fails —
              // matching will simply skip this candidate until it succeeds later.
              this.logger.error(
                `Embedding generation failed for candidate ${candidate.id}: ${embeddingError.message}`,
              );
            }
          } catch (cvProcessingError: any) {
            // Don't fail the whole application if CV parsing fails — same
            // graceful-degradation pattern as the email step below.
            this.logger.error(
              `CV extraction/structuring failed for candidate ${candidate.id}: ${cvProcessingError.message}`,
            );
          }
        } catch (fileError: any) {
          this.logger.error(`Failed to save CV file: ${fileError.message}`);
        }
      }
  
      const application = await this.prisma.application.create({
        data: {
          candidateId: candidate.id,
          answerQuestion1: createDto.answerQuestion1,
          answerQuestion2: createDto.answerQuestion2,
          answerQuestion3: createDto.answerQuestion3,
          answerQuestion4: createDto.answerQuestion4,
          answerQuestion5: createDto.answerQuestion5,
          answerQuestion6: createDto.answerQuestion6,
          status: ApplicationStatus.APPLIED,
          submittedAt: new Date(),
        },
      });
  
      await this.prisma.statusHistory.create({
        data: {
          applicationId: application.id,
          candidateId: candidate.id,
          status: ApplicationStatus.APPLIED,
          changedBy: userId,
          notes: 'Application submitted',
        },
      });
  
      // --- NEW: trigger AI scoring analysis in the background ---
      // Fire-and-forget: don't make the candidate wait for Groq before their
      // submission confirms. If this fails, analyzeAllPendingApplications
      // (or a retry job) can pick it up later.
      this.aiService.analyzeApplication(application.id).catch((err) => {
        this.logger.error(
          `Background AI analysis failed for application ${application.id}: ${err.message}`,
        );
      });
  
      try {
        await this.emailService.sendApplicationConfirmationEmail(
          user.email,
          `${createDto.firstName} ${createDto.lastName}`,
        );
      } catch (emailError: any) {
        this.logger.error(`Failed to send confirmation email: ${emailError.message}`);
      }
  
      return {
        ...application,
        candidate: {
          ...candidate,
          cvFileId: cvFileId,
        },
        user: {
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          email: user.email,
          phoneNumber: createDto.phoneNumber,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error creating application: ${error.message}`);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.preferredTheme) {
      where.candidate = { preferredTheme: filters.preferredTheme };
    }
    if (filters?.search) {
      where.candidate = {
        ...where.candidate,
        user: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          statusHistories: {
            orderBy: { changedAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          recruiterNotes: {
            orderBy: { createdAt: 'desc' },
            include: {
              recruiter: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
            cvFile: true,
            attempts: {
              include: {
                answers: true,
                result: true,
                campaign: true,
              },
              orderBy: {
                startedAt: 'desc',
              },
            },
          },
        },
        statusHistories: {
          orderBy: { changedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        recruiterNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            recruiter: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  // src/applications/applications.service.ts - Replace findMyApplication

async findMyApplication(userId: string) {
  this.logger.log(`Finding application for user: ${userId}`);
  
  const candidate = await this.prisma.candidate.findUnique({
    where: { userId },
    include: {
      attempts: {
        include: {
          campaign: true,
          result: true,
          answers: true,
        },
        orderBy: {
          startedAt: 'desc',
        },
      },
    },
  });

  if (!candidate) {
    throw new NotFoundException('No candidate profile found');
  }

  const application = await this.prisma.application.findUnique({
    where: { candidateId: candidate.id },
    include: {
      candidate: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          cvFile: true,
        },
      },
      statusHistories: {
        orderBy: { changedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundException('No application found');
  }

  // Format the response to match what the frontend expects
  return {
    id: application.id,
    status: application.status,
    submittedAt: application.submittedAt,
    answerQuestion1: application.answerQuestion1,
    answerQuestion2: application.answerQuestion2,
    answerQuestion3: application.answerQuestion3,
    answerQuestion4: application.answerQuestion4,
    answerQuestion5: application.answerQuestion5,
    answerQuestion6: application.answerQuestion6,
    candidate: {
      school: application.candidate.school,
      academicLevel: application.candidate.academicLevel,
      graduationYear: application.candidate.graduationYear,
      preferredTheme: application.candidate.preferredTheme,
      user: {
        firstName: application.candidate.user.firstName,
        lastName: application.candidate.user.lastName,
        email: application.candidate.user.email,
        phoneNumber: application.candidate.user.phoneNumber,
      },
    },
  };
}

  async updateStatus(userId: string, applicationId: string, updateDto: UpdateApplicationStatusDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: { user: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const oldStatus = application.status;
    const newStatus = updateDto.status;

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    await this.prisma.statusHistory.create({
      data: {
        applicationId: application.id,
        candidateId: application.candidateId,
        status: newStatus,
        changedBy: userId,
        notes: updateDto.notes || `Status changed from ${oldStatus} to ${newStatus}`,
      },
    });

    this.logger.log(`Application ${applicationId} status changed from ${oldStatus} to ${newStatus}`);

    const user = application.candidate.user;
    const fullName = `${user.firstName} ${user.lastName}`;

    try {
      if (newStatus === ApplicationStatus.SHORTLISTED) {
        await this.emailService.sendShortlistedEmail(user.email, fullName);
      } else if (newStatus === ApplicationStatus.ACCEPTED) {
        await this.emailService.sendAcceptanceEmail(user.email, fullName);
      } else if (newStatus === ApplicationStatus.REJECTED) {
        await this.emailService.sendRejectionEmail(user.email, fullName);
      } else if (newStatus === ApplicationStatus.TEST_INVITED) {
        await this.emailService.sendTestInvitationEmail(
          user.email,
          fullName,
          'Technical Assessment', // or fetch from the actual assessment campaign
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now, or use actual deadline
      );
        this.logger.log(`Test invitation should be sent to ${user.email}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to send status email: ${error.message}`);
    }

    return updatedApplication;
  }

  async findByStatus(status: ApplicationStatus, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.application.count({ where: { status } }),
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [total, byStatus, byTheme] = await Promise.all([
      this.prisma.application.count(),
      this.prisma.application.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.candidate.groupBy({
        by: ['preferredTheme'],
        _count: true,
        where: {
          application: {
            isNot: null,
          },
        },
      }),
    ]);

    return {
      total,
      byStatus,
      byTheme: byTheme.filter(t => t.preferredTheme !== null),
    };
  }

  // ==================== DASHBOARD METHODS ====================

  async getApplicationTimeline(userId: string) {
    this.logger.log(`Getting timeline for user: ${userId}`);
    
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return {
        hasApplied: false,
        timeline: [],
        currentStatus: null,
        aiFeedback: null,
      };
    }

    const application = await this.prisma.application.findUnique({
      where: { candidateId: candidate.id },
      include: {
        statusHistories: {
          orderBy: { changedAt: 'asc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return {
        hasApplied: false,
        timeline: [],
        currentStatus: null,
        aiFeedback: null,
      };
    }

    const pipelineSteps = [
      { key: 'APPLIED', label: 'Application Submitted', icon: '📄' },
      { key: 'SHORTLISTED', label: 'Shortlisted', icon: '⭐' },
      { key: 'TEST_INVITED', label: 'Test Invited', icon: '✉️' },
      { key: 'TEST_COMPLETED', label: 'Test Completed', icon: '✅' },
      { key: 'ACCEPTED', label: 'Accepted', icon: '🎉' },
      { key: 'REJECTED', label: 'Rejected', icon: '❌' },
    ];

    const timeline = pipelineSteps.map(step => {
      const history = application.statusHistories.find(h => h.status === step.key);
      return {
        ...step,
        completed: !!history,
        timestamp: history?.changedAt || null,
        notes: history?.notes || null,
      };
    });

    const aiFeedback = null;

    return {
      hasApplied: true,
      timeline,
      currentStatus: application.status,
      aiFeedback,
    };
  }

  async getQuickActions(userId: string) {
    this.logger.log(`Getting quick actions for user: ${userId}`);
    
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        attempts: {
          include: {
            campaign: true,
            result: true,
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!candidate) {
      return {
        actions: [],
        hasApplied: false,
      };
    }

    const application = await this.prisma.application.findUnique({
      where: { candidateId: candidate.id },
    });

    if (!application) {
      return {
        actions: [],
        hasApplied: false,
      };
    }

    const actions: Array<{
      type: string;
      label: string;
      description: string;
      icon: string;
      campaignId?: string;
      resultId?: string;
    }> = [];
    
    const latestAttempt = candidate.attempts?.[0] || null;

    switch (application.status) {
      case 'SHORTLISTED':
        if (candidate.preferredTheme) {
          const campaigns = await this.prisma.assessmentCampaign.findMany({
            where: {
              theme: candidate.preferredTheme as Theme,
              status: 'PUBLISHED',
            },
            take: 1,
          });

          if (campaigns.length > 0 && !latestAttempt) {
            actions.push({
              type: 'take_assessment',
              label: 'Take Assessment',
              description: 'Start your technical assessment',
              icon: '📝',
              campaignId: campaigns[0].id,
            });
          }
        }

        if (latestAttempt?.status === 'COMPLETED' && !latestAttempt.result) {
          actions.push({
            type: 'view_results_pending',
            label: 'Results Processing',
            description: 'Your assessment is being reviewed',
            icon: '⏳',
          });
        }

        if (latestAttempt?.result) {
          actions.push({
            type: 'view_results',
            label: 'View Assessment Results',
            description: 'See your test performance',
            icon: '📊',
            resultId: latestAttempt.result.id,
          });
        }
        break;

      case 'ACCEPTED':
        actions.push({
          type: 'view_offer',
          label: 'View Offer',
          description: 'Review your internship offer',
          icon: '🎯',
        });
        break;

      case 'TEST_COMPLETED':
        if (latestAttempt?.result) {
          actions.push({
            type: 'view_results',
            label: 'View Assessment Results',
            description: 'See your test performance',
            icon: '📊',
            resultId: latestAttempt.result.id,
          });
        }
        break;
    }

    actions.push({
      type: 'view_application',
      label: 'View Application',
      description: 'See your submitted application',
      icon: '📄',
    });

    return {
      actions,
      hasApplied: true,
    };
  }

  async getDashboardData(userId: string) {
    this.logger.log(`Getting dashboard data for user: ${userId}`);
    
    const [timeline, actions, status] = await Promise.all([
      this.getApplicationTimeline(userId),
      this.getQuickActions(userId),
      this.getMyApplicationStatus(userId),
    ]);

    return {
      status,
      timeline,
      actions,
    };
  }

  async getMyApplicationStatus(userId: string) {
    this.logger.log(`Getting status for user: ${userId}`);
    
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return { hasApplied: false };
    }

    const application = await this.prisma.application.findUnique({
      where: { candidateId: candidate.id },
    });

    if (!application) {
      return { hasApplied: false };
    }

    const aiFeedback = null;

    return {
      hasApplied: true,
      status: application.status,
      submittedAt: application.submittedAt,
      updatedAt: application.updatedAt,
      aiFeedback,
    };
  }

  async hasApplied(userId: string) {
    this.logger.log(`Checking if user ${userId} has applied`);
    
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return { hasApplied: false };
    }

    const application = await this.prisma.application.findUnique({
      where: { candidateId: candidate.id },
      select: { id: true },
    });

    return {
      hasApplied: !!application,
    };
  }

// Add to ApplicationsService class

// Get recruiter dashboard stats
async getRecruiterStats() {
  this.logger.log('Getting recruiter dashboard stats');
  
  const [total, shortlisted, pendingReview, accepted, rejected] = await Promise.all([
    this.prisma.application.count(),
    this.prisma.application.count({ where: { status: 'SHORTLISTED' } }),
    this.prisma.application.count({ where: { status: 'APPLIED' } }),
    this.prisma.application.count({ where: { status: 'ACCEPTED' } }),
    this.prisma.application.count({ where: { status: 'REJECTED' } }),
  ]);

  // Get recent applications (last 10)
  const recentApplications = await this.prisma.application.findMany({
    take: 10,
    orderBy: { submittedAt: 'desc' },
    include: {
      candidate: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Get applications by theme
  const byTheme = await this.prisma.candidate.groupBy({
    by: ['preferredTheme'],
    _count: true,
    where: {
      application: {
        isNot: null,
      },
    },
  });

  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return {
    stats: {
      total,
      shortlisted,
      pendingReview,
      accepted,
      rejected,
      acceptanceRate,
    },
    recentApplications: recentApplications.map(app => ({
      id: app.id,
      status: app.status,
      submittedAt: app.submittedAt,
      candidate: {
        name: `${app.candidate.user.firstName} ${app.candidate.user.lastName}`,
        email: app.candidate.user.email,
      },
    })),
    byTheme: byTheme.filter(t => t.preferredTheme !== null).map(t => ({
      theme: t.preferredTheme,
      count: t._count,
    })),
  };
}

// Get paginated applications for recruiter with filters
// Get paginated applications for recruiter with filters
async getRecruiterApplications(
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: string;
    theme?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.theme) {
    where.candidate = { preferredTheme: filters.theme };
  }

  if (filters?.search) {
    where.candidate = {
      ...where.candidate,
      user: {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      },
    };
  }

  // When sorting by aiScore, we can't paginate at the DB level (the sort
  // happens in-memory after fetching), so we fetch all matching rows and
  // paginate manually below. For other sort fields, DB-level skip/take is fine.
  const isAiScoreSort = filters?.sortBy === 'aiScore';

  const orderBy: any = {};
  if (!isAiScoreSort) {
    if (filters?.sortBy === 'submittedAt') {
      orderBy.submittedAt = filters.sortOrder || 'desc';
    } else if (filters?.sortBy === 'status') {
      orderBy.status = filters.sortOrder || 'asc';
    } else if (filters?.sortBy === 'name') {
      orderBy.candidate = { user: { firstName: filters.sortOrder || 'asc' } };
    } else {
      orderBy.submittedAt = 'desc';
    }
  }

  const [applications, total] = await Promise.all([
    this.prisma.application.findMany({
      where,
      ...(isAiScoreSort ? {} : { skip, take: limit }),
      orderBy: isAiScoreSort ? { submittedAt: 'desc' } : orderBy,
      include: {
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
            cvFile: true,
          },
        },
        statusHistories: {
          orderBy: { changedAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 1,
        },
        aiAnalyses: true,
      },
    }),
    this.prisma.application.count({ where }),
  ]);

  let mapped = applications.map(app => ({
    id: app.id,
    status: app.status,
    submittedAt: app.submittedAt,
    candidate: {
      id: app.candidate.id,
      name: `${app.candidate.user.firstName} ${app.candidate.user.lastName}`,
      email: app.candidate.user.email,
      phoneNumber: app.candidate.user.phoneNumber,
      preferredTheme: app.candidate.preferredTheme,
    },
    cvFile: app.candidate.cvFile,
    latestStatusHistory: app.statusHistories[0] || null,
    aiScore: app.aiAnalyses[0]?.recommendationScore ?? null,
  }));

  if (isAiScoreSort) {
    mapped = mapped.sort((a, b) => {
      const diff = (a.aiScore ?? -1) - (b.aiScore ?? -1);
      return filters?.sortOrder === 'asc' ? diff : -diff;
    });
    // Manual pagination since we sorted in-memory
    mapped = mapped.slice(skip, skip + limit);
  }

  return {
    data: mapped,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
// Get single application with full details for recruiter
async getRecruiterApplication(applicationId: string) {
  const application = await this.prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          cvFile: true,
          attempts: {
            include: {
              campaign: true,
              result: true,
            },
          },
        },
      },
      statusHistories: {
        orderBy: { changedAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      recruiterNotes: {
        orderBy: { createdAt: 'desc' },
        include: {
          recruiter: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      aiAnalyses: true, // ← confirm exact relation name from your schema
    },
  });

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  return {
    ...application,
    aiAnalysis: application.aiAnalyses[0]
      ? {
          candidateSummary: application.aiAnalyses[0].candidateSummary,
          themeClassification: application.aiAnalyses[0].themeClassification,
          recommendationScore: application.aiAnalyses[0].recommendationScore,
          recommendationExplanation: application.aiAnalyses[0].recommendationExplanation,
        }
      : null,
  };
}
// Add note to application
async addRecruiterNote(
  applicationId: string,
  recruiterId: string,
  content: string,
  category: string = 'GENERAL'
) {
  const application = await this.prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  return this.prisma.recruiterNote.create({
    data: {
      content,
      category: category as any,
      recruiterId,
      candidateId: application.candidateId,
      applicationId,
    },
    include: {
      recruiter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

async reprocessCv(candidateId: string): Promise<void> {
  const candidate = await this.prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { cvFile: true },
  });

  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }

  if (!candidate.cvFile) {
    throw new HttpException('No CV file on record for this candidate', HttpStatus.BAD_REQUEST);
  }

  const pdfBuffer = fs.readFileSync(candidate.cvFile.path);

  const extraction = await this.aiServiceClient.extractCv(
    pdfBuffer,
    candidate.cvFile.originalName,
  );
  this.logger.log(`[reprocess] CV extracted via ${extraction.method}, ${extraction.text.length} chars`);

  const structured = await this.aiServiceClient.structureCv(extraction.text);
  this.logger.log(`[reprocess] CV structured — skills: ${structured.skills?.length ?? 0}`);

  await this.prisma.candidateCV.upsert({
    where: { candidateId: candidate.id },
    create: {
      candidateId: candidate.id,
      fileId: candidate.cvFile.id,
      rawText: extraction.text,
      extractionMethod: extraction.method,
      fullName: structured.full_name,
      email: structured.email,
      phone: structured.phone,
      skills: structured.skills ?? [],
      experience: (structured.experience ?? []) as unknown as Prisma.InputJsonValue,
      education: (structured.education ?? []) as unknown as Prisma.InputJsonValue,
      projects: (structured.projects ?? []) as unknown as Prisma.InputJsonValue,
      languages: structured.languages ?? [],
      summary: structured.summary,
    },
    update: {
      fileId: candidate.cvFile.id,
      rawText: extraction.text,
      extractionMethod: extraction.method,
      fullName: structured.full_name,
      email: structured.email,
      phone: structured.phone,
      skills: structured.skills ?? [],
      experience: (structured.experience ?? []) as unknown as Prisma.InputJsonValue,
      education: (structured.education ?? []) as unknown as Prisma.InputJsonValue,
      projects: (structured.projects ?? []) as unknown as Prisma.InputJsonValue,
      languages: structured.languages ?? [],
      summary: structured.summary,
    },
  });

  this.logger.log(`[reprocess] CandidateCV saved for candidate: ${candidate.id}`);

  const embeddingText = [
    structured.summary,
    structured.skills?.length ? `Skills: ${structured.skills.join(', ')}` : null,
    ...(structured.experience ?? []).map((e) => `${e.title} at ${e.company}: ${e.description ?? ''}`),
    ...(structured.projects ?? []).map((p) => `${p.name}: ${p.description ?? ''}`),
  ]
    .filter(Boolean)
    .join('. ');

  if (embeddingText) {
    const vector = await this.aiServiceClient.generateEmbedding(embeddingText);
    await this.prisma.candidateCV.update({
      where: { candidateId: candidate.id },
      data: { embedding: vector },
    });
    this.logger.log(`[reprocess] Embedding generated and saved for candidate: ${candidate.id}`);
  } else {
    this.logger.warn(`[reprocess] No usable text to embed for candidate: ${candidate.id}`);
  }
}
}