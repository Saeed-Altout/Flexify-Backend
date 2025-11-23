import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface IEmailVerificationData {
  firstName: string | null;
  lastName: string | null;
  otp: string;
}

export interface IPasswordResetData {
  firstName: string | null;
  lastName: string | null;
  resetLink: string;
}

export interface IWelcomeData {
  firstName: string | null;
  lastName: string | null;
  otp: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private mailer: NestMailerService,
    private configService: ConfigService,
  ) {}

  async sendVerificationEmail(
    email: string,
    data: IEmailVerificationData,
  ): Promise<void> {
    const fullName = this.getFullName(data.firstName, data.lastName);

    await this.mailer.sendMail({
      to: email,
      subject: 'Verify Your Flexify Account',
      template: 'verify-account',
      context: {
        firstName: data.firstName || 'User',
        lastName: data.lastName || '',
        fullName,
        otp: data.otp,
      },
    });
  }

  async sendWelcomeEmail(email: string, data: IWelcomeData): Promise<void> {
    const fullName = this.getFullName(data.firstName, data.lastName);

    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Welcome to Flexify!',
        template: 'welcome',
        context: {
          firstName: data.firstName || 'User',
          lastName: data.lastName || '',
          fullName,
          otp: data.otp,
        },
      });
      this.logger.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}:`,
        error instanceof Error ? error.message : String(error),
      );
      this.logger.error('Error details:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    data: IPasswordResetData,
  ): Promise<void> {
    const fullName = this.getFullName(data.firstName, data.lastName);

    await this.mailer.sendMail({
      to: email,
      subject: 'Reset Your Flexify Password',
      template: 'password-reset',
      context: {
        firstName: data.firstName || 'User',
        lastName: data.lastName || '',
        fullName,
        resetLink: data.resetLink,
      },
    });
  }

  async sendPasswordResetConfirmationEmail(
    email: string,
    data: { firstName: string | null; lastName: string | null },
  ): Promise<void> {
    const fullName = this.getFullName(data.firstName, data.lastName);

    await this.mailer.sendMail({
      to: email,
      subject: 'Password Reset Successful - Flexify',
      template: 'password-reset-confirmation',
      context: {
        firstName: data.firstName || 'User',
        lastName: data.lastName || '',
        fullName,
      },
    });
  }

  async sendContactReplyEmail(
    email: string,
    data: {
      contactName: string;
      originalSubject: string | null;
      originalMessage: string;
      replyMessage: string;
      replySubject?: string;
    },
  ): Promise<void> {
    try {
      const subject = data.replySubject || `Re: ${data.originalSubject || 'Your Inquiry'}`;

      await this.mailer.sendMail({
        to: email,
        subject,
        template: 'contact-reply',
        context: {
          contactName: data.contactName,
          originalSubject: data.originalSubject || 'Your Inquiry',
          originalMessage: data.originalMessage,
          replyMessage: data.replyMessage,
        },
      });
      this.logger.log(`Contact reply email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact reply email to ${email}:`,
        error instanceof Error ? error.message : String(error),
      );
      this.logger.error('Error details:', error);
      throw error;
    }
  }

  private getFullName(
    firstName: string | null,
    lastName: string | null,
  ): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || 'User';
  }
}
