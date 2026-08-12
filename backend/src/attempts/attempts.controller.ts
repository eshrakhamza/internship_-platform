import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Attempts')
@ApiBearerAuth()
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new attempt' })
  @ApiResponse({ status: 201, description: 'Attempt created successfully' })
  async create(@Req() req: any, @Body() createDto: CreateAttemptDto) {
    const candidate = await this.attemptsService.getCandidateByUserId(req.user.id);
    return this.attemptsService.create(candidate.id, createDto.campaignId);
  }



  @Get(':id/feedback')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get AI-generated feedback for a completed attempt' })
async getAiFeedback(@Param('id') id: string) {
  return this.attemptsService.getAiFeedback(id);
}
  @Get('my/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get candidate's completed assessment attempts" })
  async getMyAttempts(@Req() req: any) {
    return this.attemptsService.getMyAttempts(req.user.id);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get attempt by ID' })
  @ApiResponse({ status: 200, description: 'Attempt details' })
  async findOne(@Param('id') id: string) {
    return this.attemptsService.findOne(id);
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
}