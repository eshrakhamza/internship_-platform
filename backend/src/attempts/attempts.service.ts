import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AttemptStatus, QuestionType } from '@prisma/client';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCandidateByUserId(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async create(candidateId: string, campaignId: string) {
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        candidateId,
        campaignId,
        status: {
          in: [AttemptStatus.IN_PROGRESS, AttemptStatus.COMPLETED],
        },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.status === AttemptStatus.COMPLETED) {
        throw new BadRequestException('You have already completed this assessment');
      }
      if (existingAttempt.status === AttemptStatus.IN_PROGRESS) {
        return existingAttempt;
      }
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        candidateId,
        campaignId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: {
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
      },
    });

    this.logger.log(`Attempt created: ${attempt.id}`);
    return attempt;
  }

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

  async submitAnswer(attemptId: string, submitDto: SubmitAnswerDto) {
    const attempt = await this.findOne(attemptId);
  
    if (attempt.status === AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }
  
    if (attempt.status === AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt has timed out');
    }
  
    const question = attempt.campaign.questions.find(q => q.id === submitDto.questionId);
    if (!question) {
      throw new BadRequestException('Question does not belong to this assessment');
    }
  
    const existingAnswer = await this.prisma.attemptAnswer.findFirst({
      where: {
        attemptId: attemptId,
        questionId: submitDto.questionId,
      },
    });
  
    if (existingAnswer) {
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
  
    return this.prisma.attemptAnswer.create({
      data: {
        attemptId: attemptId,
        questionId: submitDto.questionId,
        selectedOptionId: submitDto.selectedOptionId,
        openAnswer: submitDto.openAnswer,
      },
    });
  }

  async completeAttempt(attemptId: string) {
    const attempt = await this.findOne(attemptId);

    if (attempt.status === AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }

    if (attempt.status === AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt has already timed out');
    }

    const questions = attempt.campaign.questions;
    const answers = attempt.answers;

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
        openMax += 10;
        if (answer && answer.openAnswer) {
          // ============================================
          // TODO: AI Open Question Evaluation (FastAPI)
          // POST /api/ai/evaluate-open-question
          // ============================================
          const score = Math.min(10, Math.floor(answer.openAnswer.length / 20));
          openTotal += Math.min(10, Math.max(0, score));
        }
      }
    }

    const mcqScore = mcqMax > 0 ? Math.round((mcqTotal / mcqMax) * 100) : 0;
    const openScore = openMax > 0 ? Math.round((openTotal / openMax) * 100) : 0;
    const totalScore = mcqMax > 0 && openMax > 0 
      ? Math.round((mcqScore + openScore) / 2)
      : mcqMax > 0 ? mcqScore : openScore;

    const timeSpentSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

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

    await this.prisma.assessmentResult.create({
      data: {
        attemptId,
        mcqScore: mcqScore,
        openQuestionsScore: openScore,
        totalScore: totalScore,
      },
    });

    // ============================================
    // TODO: AI Feedback Generation (FastAPI)
    // POST /api/ai/generate-feedback
    // ============================================

    this.logger.log(`Attempt ${attemptId} completed with total score: ${totalScore}%`);
    return completedAttempt;
  }

  async getResults(attemptId: string) {
    const attempt = await this.findOne(attemptId);

    if (attempt.status !== AttemptStatus.COMPLETED && attempt.status !== AttemptStatus.TIMED_OUT) {
      throw new BadRequestException('Attempt not completed yet');
    }

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
        let correctOption: string | null = null;

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
          feedback: a.feedback || null,
        };
      }),
    };
  }
}