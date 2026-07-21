import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostingDto } from './dto/create-posting.dto';
import { UpdatePostingDto } from './dto/update-posting.dto';

@Injectable()
export class PostingsService {
  private readonly logger = new Logger(PostingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostingDto) {
    this.logger.log(`Creating internship posting by user: ${userId}`);

    const posting = await this.prisma.internshipPosting.create({
      data: {
        title: dto.title,
        description: dto.description,
        theme: dto.theme,
        requiredSkills: dto.requiredSkills,
        preferredSkills: dto.preferredSkills || [],
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        positions: dto.positions || 1,
        location: dto.location,
        isRemote: dto.isRemote || false,
        status: dto.status || 'DRAFT',
        createdBy: userId,
      },
    });

    this.logger.log(`Internship posting created: ${posting.id}`);
    return posting;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.theme) where.theme = filters.theme;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [postings, total] = await Promise.all([
      this.prisma.internshipPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.internshipPosting.count({ where }),
    ]);

    return {
      data: postings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const posting = await this.prisma.internshipPosting.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        applications: {
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!posting) {
      throw new NotFoundException('Internship posting not found');
    }

    return posting;
  }

  async update(id: string, dto: UpdatePostingDto) {
    const posting = await this.findOne(id);

    if (posting.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot update a published posting');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.requiredSkills !== undefined) updateData.requiredSkills = dto.requiredSkills;
    if (dto.preferredSkills !== undefined) updateData.preferredSkills = dto.preferredSkills;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.positions !== undefined) updateData.positions = dto.positions;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.isRemote !== undefined) updateData.isRemote = dto.isRemote;
    if (dto.status !== undefined) updateData.status = dto.status;

    return this.prisma.internshipPosting.update({
      where: { id },
      data: updateData,
    });
  }

  async publish(id: string) {
    const posting = await this.findOne(id);

    if (posting.status === 'PUBLISHED') {
      throw new BadRequestException('Posting is already published');
    }

    return this.prisma.internshipPosting.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  async archive(id: string) {
    const posting = await this.findOne(id);

    if (posting.status === 'ARCHIVED') {
      throw new BadRequestException('Posting is already archived');
    }

    return this.prisma.internshipPosting.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    const posting = await this.findOne(id);

    if (posting.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot delete a published posting');
    }

    return this.prisma.internshipPosting.delete({
      where: { id },
    });
  }
}