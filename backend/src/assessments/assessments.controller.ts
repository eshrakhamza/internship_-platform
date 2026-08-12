import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { PublishAssessmentDto } from './dto/publish-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Difficulty, Theme, UserRole } from '@prisma/client';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // --- Static/candidate routes MUST come before ':id' so they aren't
  // swallowed by the catch-all dynamic param route below. ---

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get available assessments for candidate' })
  @ApiResponse({ status: 200, description: 'Available assessments' })
  async getAvailableAssessments(@Req() req: any) {
    return this.assessmentsService.getAvailableAssessments(req.user.id);
  }

  @Post('preview-questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate AI question suggestions without saving' })
  async previewQuestions(
    @Body() body: { theme: Theme; difficulty: Difficulty; mcqCount?: number; openCount?: number },
  ) {
    return this.assessmentsService.previewQuestions(
      body.theme,
      body.difficulty,
      body.mcqCount || 5,
      body.openCount || 2,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new assessment with AI-generated questions' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  async create(@Req() req: any, @Body() createDto: CreateAssessmentDto) {
    return this.assessmentsService.create(req.user.id, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all assessments' })
  @ApiResponse({ status: 200, description: 'List of assessments' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.assessmentsService.findAll(page, limit, status);
  }

  // --- ':id/...' routes (multi-segment, no conflict with 'available') ---

  @Get(':id/candidate-suggestions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get AI-matched candidates for this assessment theme' })
  async getCandidateSuggestions(@Param('id') id: string) {
    return this.assessmentsService.getCandidateSuggestions(id);
  }

  @Get(':id/take')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get assessment for taking' })
  @ApiResponse({ status: 200, description: 'Assessment details' })
  async getAssessmentForTaking(@Param('id') id: string, @Req() req: any) {
    return this.assessmentsService.getAssessmentForTaking(id, req.user.id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish assessment and invite candidates' })
  @ApiResponse({ status: 200, description: 'Assessment published successfully' })
  async publish(@Param('id') id: string, @Body() publishDto: PublishAssessmentDto) {
    return this.assessmentsService.publish(id, publishDto);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get assessment results' })
  @ApiResponse({ status: 200, description: 'Assessment results' })
  async getResults(@Param('id') id: string) {
    return this.assessmentsService.getResults(id);
  }

  // --- bare ':id' MUST be last among GET routes on this resource ---

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiResponse({ status: 200, description: 'Assessment details' })
  async findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update assessment' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete assessment' })
  @ApiResponse({ status: 200, description: 'Assessment deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.assessmentsService.delete(id);
  }
}