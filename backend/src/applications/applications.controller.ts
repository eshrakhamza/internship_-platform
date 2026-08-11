// src/applications/applications.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { AiService } from '../ai/ai.service'; // ← add this, adjust path if needed
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly aiService: AiService, // ← add this
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cv', {
    storage: diskStorage({
      destination: './uploads/cvs',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Invalid file type. Only PDF and Word documents are allowed.'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  async create(
    @Req() req: any,
    @Body() createDto: CreateApplicationDto,
    @UploadedFile() file?: any,
  ) {
    return this.applicationsService.create(req.user.id, createDto, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all applications (recruiters only)' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('theme') theme?: string,
    @Query('search') search?: string,
  ) {
    const filters = { status, preferredTheme: theme, search };
    return this.applicationsService.findAll(page, limit, filters);
  }

  @Get('my-application')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my application' })
  @ApiResponse({ status: 200, description: 'My application details' })
  async getMyApplication(@Req() req: any) {
    return this.applicationsService.findMyApplication(req.user.id);
  }

  @Get('has-applied')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if user has applied' })
  @ApiResponse({ status: 200, description: 'Has applied status' })
  async hasApplied(@Req() req: any) {
    return this.applicationsService.hasApplied(req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my application status' })
  @ApiResponse({ status: 200, description: 'Application status' })
  async getMyApplicationStatus(@Req() req: any) {
    return this.applicationsService.getMyApplicationStatus(req.user.id);
  }

  @Get('timeline')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get application timeline for dashboard' })
  @ApiResponse({ status: 200, description: 'Application timeline' })
  async getTimeline(@Req() req: any) {
    return this.applicationsService.getApplicationTimeline(req.user.id);
  }

  @Get('quick-actions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get quick actions for dashboard' })
  @ApiResponse({ status: 200, description: 'Quick actions' })
  async getQuickActions(@Req() req: any) {
    return this.applicationsService.getQuickActions(req.user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get complete dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Req() req: any) {
    return this.applicationsService.getDashboardData(req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiResponse({ status: 200, description: 'Application statistics' })
  async getStats() {
    return this.applicationsService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application details' })
  async findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({ status: 200, description: 'Application status updated' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(req.user.id, id, updateDto);
  }

  @Get('status/:status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get applications by status' })
  @ApiResponse({ status: 200, description: 'Applications by status' })
  async findByStatus(
    @Param('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.applicationsService.findByStatus(status as any, page, limit);
  }

  // ============================================
  // AI Endpoints — manual trigger/retry, in addition to the automatic
  // background trigger that now fires on application submission.
  // Useful for: retrying a failed analysis, or backfilling analysis/embeddings
  // for applications created before automatic triggering existed.
  // ============================================
  @Post(':id/analyze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually trigger (or retry) AI analysis for an application' })
  @ApiResponse({ status: 200, description: 'AI analysis completed' })
  async analyzeApplication(@Param('id') id: string) {
    return this.aiService.analyzeApplication(id);
  }

  @Post('analyze-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Analyze all applications missing AI analysis' })
  @ApiResponse({ status: 200, description: 'All pending applications analyzed' })
  async analyzeAllApplications() {
    return this.aiService.analyzeAllPendingApplications();
  }

  @Get('recruiter/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get recruiter dashboard stats' })
  @ApiResponse({ status: 200, description: 'Recruiter stats' })
  async getRecruiterStats() {
    return this.applicationsService.getRecruiterStats();
  }

  @Get('recruiter/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get paginated applications for recruiter' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async getRecruiterApplications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('theme') theme?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.applicationsService.getRecruiterApplications(page, limit, {
      status,
      theme,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('recruiter/application/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application details for recruiter' })
  @ApiResponse({ status: 200, description: 'Application details' })
  async getRecruiterApplication(@Param('id') id: string) {
    return this.applicationsService.getRecruiterApplication(id);
  }

  @Post('recruiter/application/:id/note')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add note to application' })
  @ApiResponse({ status: 201, description: 'Note added successfully' })
  async addRecruiterNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string; category?: string },
  ) {
    return this.applicationsService.addRecruiterNote(
      id,
      req.user.id,
      body.content,
      body.category,
    );
  }

  @Post('candidate/:candidateId/reprocess-cv')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECRUITER, UserRole.ADMIN)
@ApiOperation({ summary: 'Re-run CV extraction, structuring, and embedding for a candidate' })
async reprocessCv(@Param('candidateId') candidateId: string) {
  await this.applicationsService.reprocessCv(candidateId);
  return { status: 'reprocessed' };
}
}