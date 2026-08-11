import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType, CampaignStatus } from '@prisma/client';
import { CreateQuestionDto } from '../assessments/dto/create-assessment.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEditable(campaignId: string) {
    const campaign = await this.prisma.assessmentCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Assessment not found');
    if (campaign.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Cannot modify questions on a published assessment');
    }
    return campaign;
  }

  async addQuestion(campaignId: string, dto: CreateQuestionDto) {
    await this.assertEditable(campaignId);

    const maxOrder = await this.prisma.question.aggregate({
      where: { campaignId },
      _max: { order: true },
    });

    return this.prisma.question.create({
      data: {
        campaignId,
        type: dto.type === 'OPEN' ? QuestionType.OPEN : QuestionType.MCQ,
        questionText: dto.questionText,
        explanation: dto.explanation,
        expectedAnswer: dto.expectedAnswer,
        order: (maxOrder._max.order ?? -1) + 1,
        options: dto.options
          ? { create: dto.options.map((opt, i) => ({ optionText: opt.optionText, isCorrect: opt.isCorrect, order: i })) }
          : undefined,
      },
      include: { options: true },
    });
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertEditable(question.campaignId);

    if (dto.options) {
      await this.prisma.mCQOption.deleteMany({ where: { questionId } });
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: dto.questionText,
        explanation: dto.explanation,
        expectedAnswer: dto.expectedAnswer,
        options: dto.options
          ? { create: dto.options.map((opt, i) => ({ optionText: opt.optionText, isCorrect: opt.isCorrect, order: i })) }
          : undefined,
      },
      include: { options: true },
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');
    await this.assertEditable(question.campaignId);

    await this.prisma.mCQOption.deleteMany({ where: { questionId } });
    return this.prisma.question.delete({ where: { id: questionId } });
  }
}