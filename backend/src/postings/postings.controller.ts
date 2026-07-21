import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostingsService } from './postings.service';
import { CreatePostingDto } from './dto/create-posting.dto';
import { UpdatePostingDto } from './dto/update-posting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Postings')
@ApiBearerAuth()
@Controller('postings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECRUITER, UserRole.ADMIN)
export class PostingsController {
  constructor(private readonly postingsService: PostingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new internship posting' })
  @ApiResponse({ status: 201, description: 'Posting created successfully' })
  async create(@Req() req: any, @Body() createDto: CreatePostingDto) {
    return this.postingsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all internship postings' })
  @ApiResponse({ status: 200, description: 'List of postings' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('theme') theme?: string,
    @Query('search') search?: string,
  ) {
    return this.postingsService.findAll(page, limit, { status, theme, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get posting by ID' })
  @ApiResponse({ status: 200, description: 'Posting details' })
  async findOne(@Param('id') id: string) {
    return this.postingsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update posting' })
  @ApiResponse({ status: 200, description: 'Posting updated successfully' })
  async update(@Param('id') id: string, @Body() updateDto: UpdatePostingDto) {
    return this.postingsService.update(id, updateDto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a posting' })
  @ApiResponse({ status: 200, description: 'Posting published successfully' })
  async publish(@Param('id') id: string) {
    return this.postingsService.publish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a posting' })
  @ApiResponse({ status: 200, description: 'Posting archived successfully' })
  async archive(@Param('id') id: string) {
    return this.postingsService.archive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a posting' })
  @ApiResponse({ status: 200, description: 'Posting deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.postingsService.delete(id);
  }
}