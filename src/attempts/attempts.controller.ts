import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Attempts')
@ApiBearerAuth()
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get attempt by ID' })
  @ApiResponse({ status: 200, description: 'Attempt details' })
  async findOne(@Param('id') id: string) {
    return this.attemptsService.findOne(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start an attempt' })
  @ApiResponse({ status: 200, description: 'Attempt started' })
  async startAttempt(@Param('id') id: string) {
    return this.attemptsService.startAttempt(id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit answer for a question' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  async submitAnswer(
    @Param('id') id: string,
    @Body() submitDto: SubmitAnswerDto,
  ) {
    return this.attemptsService.submitAnswer(id, submitDto);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete the attempt' })
  @ApiResponse({ status: 200, description: 'Attempt completed' })
  async completeAttempt(@Param('id') id: string) {
    return this.attemptsService.completeAttempt(id);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get attempt results' })
  @ApiResponse({ status: 200, description: 'Attempt results' })
  async getResults(@Param('id') id: string) {
    return this.attemptsService.getResults(id);
  }

  @Get('candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all attempts for a candidate' })
  @ApiResponse({ status: 200, description: 'List of candidate attempts' })
  async findByCandidate(@Param('candidateId') candidateId: string) {
    return this.attemptsService.findByCandidate(candidateId);
  }

  @Get('assessment/:campaignId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all attempts for an assessment' })
  @ApiResponse({ status: 200, description: 'List of assessment attempts' })
  async getAssessmentAttempts(@Param('campaignId') campaignId: string) {
    return this.attemptsService.getAssessmentAttempts(campaignId);
  }
}