import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore: Map<string, { otp: string; expiresAt: Date }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async sendOtp(email: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    this.otpStore.set(email, { otp, expiresAt });
    this.logger.log(`OTP for ${email}: ${otp}`);

    // Send OTP via email
    try {
      await this.emailService.sendOtpEmail(email, otp);
      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    const storedOtp = this.otpStore.get(email);

    if (!storedOtp) {
      throw new UnauthorizedException('OTP not found or expired');
    }

    if (storedOtp.expiresAt < new Date()) {
      this.otpStore.delete(email);
      throw new UnauthorizedException('OTP has expired');
    }

    if (storedOtp.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    this.otpStore.delete(email);

    // Check if user exists with their candidate profile
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        candidate: true,
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: 'New',
          lastName: 'User',
          role: UserRole.CANDIDATE,
          isActive: true,
        },
        include: {
          candidate: true,
        },
      });

      // Create candidate profile
      await this.prisma.candidate.create({
        data: {
          userId: user.id,
        },
      });

      this.logger.log(`New user created: ${email}`);
    } else if (!user.candidate) {
      // User exists but candidate doesn't - create it
      await this.prisma.candidate.create({
        data: {
          userId: user.id,
        },
      });
      this.logger.log(`Candidate created for existing user: ${email}`);
    }

    // Fetch user with candidate again to ensure we have the latest data
    const userWithCandidate = await this.prisma.user.findUnique({
      where: { email },
      include: {
        candidate: true,
      },
    });

    // Type guard to ensure user exists
    if (!userWithCandidate) {
      throw new NotFoundException('User not found after creation');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: userWithCandidate.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const payload = {
      sub: userWithCandidate.id,
      email: userWithCandidate.email,
      role: userWithCandidate.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: userWithCandidate.id,
        email: userWithCandidate.email,
        firstName: userWithCandidate.firstName,
        lastName: userWithCandidate.lastName,
        role: userWithCandidate.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}