import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AttemptStatus, QuestionType } from '@prisma/client';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Get attempt by ID with all details
  async findOne(id: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        campaign: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  // Get attempt by candidate and campaign
  async findByCandidateAndCampaign(candidateId: string, campaignId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        candidateId,
        campaignId,
      },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        campaign: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  // Get all attempts for a candidate
  async findByCandidate(candidateId: string) {
    return this.prisma.attempt.findMany({
      where: { candidateId },
      include: {
        campaign: true,
        result: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Start an attempt
  async startAttempt(attemptId: string) {
    const attempt = await this.findOne(attemptId);

    if (attempt.status === AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }

    if (attempt.status === AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt has timed out');
    }

    // Update startedAt if not already set
    if (!attempt.startedAt) {
      return this.prisma.attempt.update({
        where: { id: attemptId },
        data: {
          startedAt: new Date(),
          status: AttemptStatus.IN_PROGRESS,
        },
      });
    }

    return attempt;
  }

  // Submit answer for a question
// Submit answer for a question
// Submit answer for a question
async submitAnswer(attemptId: string, submitDto: SubmitAnswerDto) {
    const attempt = await this.findOne(attemptId);
  
    if (attempt.status === AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }
  
    if (attempt.status === AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt has timed out');
    }
  
    // Check if the question belongs to this attempt
    const question = attempt.campaign.questions.find(q => q.id === submitDto.questionId);
    if (!question) {
      throw new BadRequestException('Question does not belong to this assessment');
    }
  
    // Check if answer already exists using findFirst (simpler approach)
    const existingAnswer = await this.prisma.attemptAnswer.findFirst({
      where: {
        attemptId: attemptId,
        questionId: submitDto.questionId,
      },
    });
  
    if (existingAnswer) {
      // Update existing answer
      return this.prisma.attemptAnswer.update({
        where: {
          id: existingAnswer.id,
        },
        data: {
          selectedOptionId: submitDto.selectedOptionId,
          openAnswer: submitDto.openAnswer,
        },
      });
    }
  
    // Create new answer
    return this.prisma.attemptAnswer.create({
      data: {
        attemptId: attemptId,
        questionId: submitDto.questionId,
        selectedOptionId: submitDto.selectedOptionId,
        openAnswer: submitDto.openAnswer,
      },
    });
  }
  // Complete the attempt and calculate score
  async completeAttempt(attemptId: string) {
    const attempt = await this.findOne(attemptId);

    if (attempt.status === AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }

    if (attempt.status === AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt has already timed out');
    }

    // Get all questions for this attempt
    const questions = attempt.campaign.questions;

    // Get all answers
    const answers = attempt.answers;

    // Calculate MCQ scores
    let mcqTotal = 0;
    let mcqMax = 0;
    let openTotal = 0;
    let openMax = 0;

    for (const question of questions) {
      const answer = answers.find(a => a.questionId === question.id);

      if (question.type === QuestionType.MCQ) {
        mcqMax += 1;
        if (answer && answer.selectedOptionId) {
          const selectedOption = question.options.find(o => o.id === answer.selectedOptionId);
          if (selectedOption && selectedOption.isCorrect) {
            mcqTotal += 1;
          }
        }
      } else if (question.type === QuestionType.OPEN) {
        openMax += 10; // Max 10 points per open question
        if (answer && answer.openAnswer) {
          // For now, give a default score for open questions
          // AI evaluation will be added later
          const score = Math.min(10, Math.floor(answer.openAnswer.length / 20));
          openTotal += Math.min(10, Math.max(0, score));
        }
      }
    }

    // Calculate percentages
    const mcqScore = mcqMax > 0 ? Math.round((mcqTotal / mcqMax) * 100) : 0;
    const openScore = openMax > 0 ? Math.round((openTotal / openMax) * 100) : 0;
    const totalScore = Math.round((mcqScore + openScore) / 2);

    // Calculate time spent
    const timeSpentSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

    // Update attempt with scores
    const completedAttempt = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.COMPLETED,
        completedAt: new Date(),
        mcqScore: mcqScore,
        openQuestionsScore: openScore,
        totalScore: totalScore,
        timeSpentSeconds: timeSpentSeconds,
      },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        campaign: true,
      },
    });

    // Create assessment result
    await this.prisma.assessmentResult.create({
      data: {
        attemptId,
        mcqScore: mcqScore,
        openQuestionsScore: openScore,
        totalScore: totalScore,
      },
    });

    this.logger.log(`Attempt ${attemptId} completed with total score: ${totalScore}%`);
    return completedAttempt;
  }

  // Auto-submit timed out attempts
  async handleTimeout(attemptId: string) {
    const attempt = await this.findOne(attemptId);

    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      this.logger.log(`Attempt ${attemptId} has timed out. Auto-submitting...`);
      return this.completeAttempt(attemptId);
    }

    return attempt;
  }

  // Get attempt results
  async getResults(attemptId: string) {
    const attempt = await this.findOne(attemptId);

    if (attempt.status !== AttemptStatus.COMPLETED && attempt.status !== AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt not completed yet');
    }

    // Get detailed answers with feedback
    const answersWithFeedback = await this.prisma.attemptAnswer.findMany({
      where: { attemptId },
      include: {
        question: {
          include: {
            options: true,
          },
        },
        selectedOption: true,
      },
    });

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        timeSpentSeconds: attempt.timeSpentSeconds,
      },
      scores: {
        mcqScore: attempt.mcqScore,
        openQuestionsScore: attempt.openQuestionsScore,
        totalScore: attempt.totalScore,
      },
      answers: answersWithFeedback.map(a => {
        const question = a.question;
        let isCorrect = false;
        let correctOption: string | null = null; // FIXED: Explicitly type as string | null

        if (question.type === QuestionType.MCQ) {
          const correctOpt = question.options.find(o => o.isCorrect);
          correctOption = correctOpt ? correctOpt.optionText : null;
          isCorrect = a.selectedOption ? a.selectedOption.isCorrect : false;
        }

        return {
          questionId: a.questionId,
          questionText: question.questionText,
          type: question.type,
          selectedOption: a.selectedOption ? a.selectedOption.optionText : null,
          isCorrect: isCorrect,
          correctOption: correctOption,
          openAnswer: a.openAnswer,
          score: a.score,
          feedback: a.feedback,
        };
      }),
    };
  }

  // Get all attempts for an assessment (recruiter view)
  async getAssessmentAttempts(campaignId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { campaignId },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
        result: true,
      },
      orderBy: { totalScore: 'desc' },
    });

    return {
      total: attempts.length,
      completed: attempts.filter(a => a.status === AttemptStatus.COMPLETED).length,
      inProgress: attempts.filter(a => a.status === AttemptStatus.IN_PROGRESS).length,
      timedOut: attempts.filter(a => a.status === AttemptStatus.TIMED_OUT).length,
      attempts: attempts.map(a => ({
        id: a.id,
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