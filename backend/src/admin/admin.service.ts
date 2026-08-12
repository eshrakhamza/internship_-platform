import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      usersByRole,
      activeUsers,
      recentSignups,
      totalPostings,
      publishedPostings,
      totalApplications,
      applicationsByStatus,
      totalCampaigns,
      publishedCampaigns,
      totalAttempts,
      completedAttempts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.internshipPosting.count(),
      this.prisma.internshipPosting.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.application.count(),
      this.prisma.application.groupBy({ by: ['status'], _count: true }),
      this.prisma.assessmentCampaign.count(),
      this.prisma.assessmentCampaign.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.attempt.count(),
      this.prisma.attempt.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        recentSignups,
        byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
      },
      postings: {
        total: totalPostings,
        published: publishedPostings,
        draftOrArchived: totalPostings - publishedPostings,
      },
      applications: {
        total: totalApplications,
        byStatus: Object.fromEntries(applicationsByStatus.map((a) => [a.status, a._count])),
      },
      campaigns: {
        total: totalCampaigns,
        published: publishedCampaigns,
      },
      assessments: {
        totalAttempts,
        completedAttempts,
        inProgress: totalAttempts - completedAttempts,
      },
    };
  }

  async getUsers(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const isActive =
      query.isActive === undefined ? undefined : query.isActive === 'true';

    const where = {
      ...(query.role && { role: query.role }),
      ...(isActive !== undefined && { isActive }),
      ...(query.search && {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          candidate: {
            select: { school: true, academicLevel: true, preferredTheme: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        candidate: {
          include: { application: true, cvData: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: string, role: UserRole, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot change your own role');
    }
    await this.ensureUserExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateUserStatus(id: string, isActive: boolean, currentUserId: string) {
    if (id === currentUserId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    await this.ensureUserExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  private async ensureUserExists(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('User not found');
  }
}