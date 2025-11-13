import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  constructor(
    private readonly mailerService: NestMailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
    const year = new Date().getFullYear();

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        resetUrl,
        token,
        email,
        year,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const year = new Date().getFullYear();

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Account',
      template: 'verification-code',
      context: {
        code,
        email,
        year,
      },
    });
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const year = new Date().getFullYear();

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome!',
      template: 'welcome',
      context: {
        email,
        name: name || 'User',
        year,
      },
    });
  }
}

