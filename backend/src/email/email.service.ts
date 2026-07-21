import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('SMTP_USER') || 'noreply@example.com';
    
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false, // Only for development
      },
    });

    this.logger.log('Email service initialized');
  }

  // Send OTP email
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const subject = 'Your OTP Verification Code';
    const html = this.generateOtpTemplate(otp);
    const text = `Your OTP code is: ${otp}. It will expire in 10 minutes.`;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    this.logger.log(`OTP email sent to ${email}`);
  }

  // Send shortlisted email
  async sendShortlistedEmail(email: string, name: string): Promise<void> {
    const subject = 'Congratulations! You Have Been Shortlisted';
    const html = this.generateShortlistedTemplate(name);
    const text = `Dear ${name},\n\nCongratulations! You have been shortlisted for the next stage of the internship process.`;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });

    this.logger.log(`Shortlisted email sent to ${email}`);
  }

  // Send acceptance email
  async sendAcceptanceEmail(email: string, name: string): Promise<void> {
    const subject = 'Congratulations! You Have Been Selected';
    const html = this.generateAcceptanceTemplate(name);
    const text = `Dear ${name},\n\nCongratulations! You have been selected for the internship position.`;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });

    this.logger.log(`Acceptance email sent to ${email}`);
  }

  // Send rejection email
  async sendRejectionEmail(email: string, name: string): Promise<void> {
    const subject = 'Application Update';
    const html = this.generateRejectionTemplate(name);
    const text = `Dear ${name},\n\nThank you for your interest. We regret to inform you that you have not been selected.`;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });

    this.logger.log(`Rejection email sent to ${email}`);
  }

  // Send test invitation email
  async sendTestInvitationEmail(email: string, name: string, testName: string, deadline: Date): Promise<void> {
    const subject = `Invitation: ${testName}`;
    const html = this.generateTestInvitationTemplate(name, testName, deadline);
    const text = `Dear ${name},\n\nYou have been invited to take the ${testName}. Please complete it by ${deadline.toLocaleDateString()}.`;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });

    this.logger.log(`Test invitation email sent to ${email}`);
  }

  // Generic email sender
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"Internship Platform" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  // Email Templates
  private generateOtpTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; padding: 20px; letter-spacing: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .expiry { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Internship Platform</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your verification:</p>
            <div class="otp-code">${otp}</div>
            <p>This OTP is valid for <span class="expiry">10 minutes</span>.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateShortlistedTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the next stage of the internship selection process.</p>
            <p>You will receive further instructions about the technical assessment soon.</p>
            <p>We were impressed by your application and look forward to learning more about you.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Internship Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAcceptanceTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 You're In!</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>We are thrilled to inform you that you have been <strong>selected</strong> for the internship position!</p>
            <p>Your skills, experience, and enthusiasm impressed us throughout the process.</p>
            <p>We will be sending you more details about the onboarding process shortly.</p>
            <br>
            <p>Welcome aboard! 🚀</p>
            <p><strong>Internship Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateRejectionTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Update</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for your interest in our internship program.</p>
            <p>After careful consideration of all applications, we regret to inform you that you have <strong>not been selected</strong> for this position.</p>
            <p>This was a difficult decision, and we appreciate the time and effort you invested in your application.</p>
            <p>We encourage you to apply for future opportunities.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Internship Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTestInvitationTemplate(name: string, testName: string, deadline: Date): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Technical Assessment Invitation</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>You have been invited to take the <strong>${testName}</strong> technical assessment.</p>
            <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}</p>
            <p>Please log in to the platform to access your assessment.</p>
            <p>Make sure you have a stable internet connection and complete the assessment before the deadline.</p>
            <br>
            <p>Good luck! 🍀</p>
            <p><strong>Internship Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  // Add this method to the EmailService class

async sendApplicationConfirmationEmail(email: string, name: string): Promise<void> {
    const subject = 'Application Received - Thank You!';
    const html = this.generateApplicationConfirmationTemplate(name);
    const text = `Dear ${name},\n\nThank you for submitting your application. We have received it and will review it shortly.\n\nBest regards,\nInternship Team`;
  
    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  
    this.logger.log(`Application confirmation email sent to ${email}`);
  }
  
  // Add this template method
  private generateApplicationConfirmationTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .status { display: inline-block; padding: 8px 16px; background: #10B981; color: white; border-radius: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Application Received</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for submitting your application for the internship program.</p>
            <p>Your application has been received and is now under review.</p>
            <p><span class="status">Status: APPLIED</span></p>
            <p>We will review your application and get back to you soon.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Internship Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}