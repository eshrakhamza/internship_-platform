import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { AiService } from '../ai/ai.service';
@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly aiService: AiService, // Add this
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  async create(@Req() req: any, @Body() createDto: CreateApplicationDto) {
    return this.applicationsService.create(req.user.id, createDto);
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


  // Add this endpoint:
@Post(':id/analyze')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECRUITER, UserRole.ADMIN)
@ApiOperation({ summary: 'Analyze application with AI' })
@ApiResponse({ status: 200, description: 'AI analysis completed' })
async analyzeApplication(@Param('id') id: string) {
  return this.aiService.analyzeApplication(id);
}
@Post('analyze-all')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECRUITER, UserRole.ADMIN)
@ApiOperation({ summary: 'Analyze all pending applications with AI' })
@ApiResponse({ status: 200, description: 'All applications analyzed' })
async analyzeAllApplications() {
  return this.aiService.analyzeAllPendingApplications();
}

}