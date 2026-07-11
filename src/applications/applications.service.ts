import { HttpException, HttpStatus, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Create a new application
 
  async create(userId: string, createDto: CreateApplicationDto) {
    this.logger.log(`Creating application for user: ${userId}`);
    
    try {
      // Check if user exists with candidate
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { 
          candidate: true,
        },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      // Check if candidate exists
      let candidate = user.candidate;
      if (!candidate) {
        // Create candidate if it doesn't exist
        candidate = await this.prisma.candidate.create({
          data: {
            userId: userId,
          },
        });
        this.logger.log(`Candidate created: ${candidate.id}`);
      }
  
      // Check if application already exists for this candidate
      const existingApplication = await this.prisma.application.findUnique({
        where: { candidateId: candidate.id },
      });
  
      if (existingApplication) {
        throw new HttpException('You have already submitted an application', HttpStatus.CONFLICT);
      }
  
      // Update user profile
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          phoneNumber: createDto.phoneNumber,
        },
      });
  
      // Update candidate profile
      await this.prisma.candidate.update({
        where: { userId },
        data: {
          school: createDto.school,
          academicLevel: createDto.academicLevel,
          graduationYear: createDto.graduationYear,
          preferredTheme: createDto.preferredTheme,
        },
      });
  
      // Create the application using candidate.id
      const application = await this.prisma.application.create({
        data: {
          candidateId: candidate.id,  // ← THIS IS THE KEY FIX
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
  
      // Create status history
      await this.prisma.statusHistory.create({
        data: {
          applicationId: application.id,
          candidateId: candidate.id,  // ← Use candidate.id here too
          status: ApplicationStatus.APPLIED,
          changedBy: userId,
          notes: 'Application submitted',
        },
      });
  
      // Send confirmation email
      try {
        await this.emailService.sendApplicationConfirmationEmail(
          user.email,
          `${createDto.firstName} ${createDto.lastName}`,
        );
      } catch (emailError) {
        this.logger.error(`Failed to send confirmation email: ${emailError.message}`);
      }
  
      return {
        ...application,
        candidate,
        user: {
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          email: user.email,
          phoneNumber: createDto.phoneNumber,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating application: ${error.message}`);
      throw error;
    }
  }

  // Get all applications (for recruiters)
  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
  
    const where: any = {};
  
    if (filters?.status) {
      where.status = filters.status;
    }
  
    if (filters?.preferredTheme) {
      where.candidate = {
        preferredTheme: filters.preferredTheme,
      };
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
              aiAnalyses: true,
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
  // Get a single application by ID
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
            aiAnalyses: true,
            attempts: {
              include: {
                answers: true,
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
        aiAnalysis: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  // Get application by user ID
  async findMyApplication(userId: string) {
    this.logger.log(`Finding application for user: ${userId}`);
    
    // First, find the candidate record for this user
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
  
    if (!candidate) {
      this.logger.error(`No candidate profile found for user: ${userId}`);
      throw new NotFoundException('No candidate profile found');
    }
  
    this.logger.log(`Candidate found with ID: ${candidate.id}`);
  
    // Now find the application using the candidate's ID
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
            aiAnalyses: true,
            attempts: {
              include: {
                answers: true,
                result: true,
              },
            },
          },
        },
        statusHistories: {
          orderBy: { changedAt: 'desc' },
        },
        aiAnalysis: true,
      },
    });
  
    if (!application) {
      this.logger.error(`No application found for candidate: ${candidate.id}`);
      throw new NotFoundException('No application found');
    }
  
    this.logger.log(`Application found with ID: ${application.id}`);
    return application;
  }

  // Update application status (for recruiters)
  async updateStatus(userId: string, applicationId: string, updateDto: UpdateApplicationStatusDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const oldStatus = application.status;
    const newStatus = updateDto.status;

    // Update application status
    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    // Create status history
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

    // Send email notifications based on status change
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
        // We'll implement this later
        this.logger.log(`Test invitation should be sent to ${user.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send status email: ${error.message}`);
    }

    return updatedApplication;
  }

  // Get applications by status (for recruiters)
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

  // Get application statistics (for dashboard)
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
}