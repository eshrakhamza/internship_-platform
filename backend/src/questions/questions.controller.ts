import { Controller, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from '../assessments/dto/create-assessment.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('assessments/:assessmentId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a question to a draft assessment' })
  async addQuestion(@Param('assessmentId') assessmentId: string, @Body() dto: CreateQuestionDto) {
    return this.questionsService.addQuestion(assessmentId, dto);
  }

  @Put(':questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a question on a draft assessment' })
  async updateQuestion(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.updateQuestion(questionId, dto);
  }

  @Delete(':questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a question from a draft assessment' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.questionsService.deleteQuestion(questionId);
  }
}