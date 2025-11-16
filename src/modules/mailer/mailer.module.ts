import { Module, Logger } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { existsSync } from 'fs';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('MailerModule');

        // Validate email configuration
        const mailHost = configService.get<string>('MAIL_HOST');
        const mailPort = configService.get<number>('MAIL_PORT');
        const mailUser = configService.get<string>('MAIL_USER');
        const mailPass = configService.get<string>('MAIL_PASS');
        const mailFrom = configService.get<string>('MAIL_FROM');

        if (!mailHost || !mailPort || !mailUser || !mailPass || !mailFrom) {
          logger.warn(
            'Email configuration is incomplete. Email sending may fail.',
          );
          logger.warn(
            `MAIL_HOST: ${mailHost ? '✓' : '✗'}, MAIL_PORT: ${mailPort ? '✓' : '✗'}, MAIL_USER: ${mailUser ? '✓' : '✗'}, MAIL_PASS: ${mailPass ? '✓' : '✗'}, MAIL_FROM: ${mailFrom ? '✓' : '✗'}`,
          );
        } else {
          logger.log('Email configuration loaded successfully');
        }

        // Template directory - nest-cli.json copies templates to dist/modules/mailer/templates
        // __dirname points to dist/modules/mailer in both dev and production
        let templateDir = join(__dirname, 'templates');

        // Fallback: if templates not found in dist, try source directory (for dev/watch mode)
        if (!existsSync(templateDir)) {
          const sourceTemplateDir = join(
            process.cwd(),
            'src',
            'modules',
            'mailer',
            'templates',
          );
          if (existsSync(sourceTemplateDir)) {
            templateDir = sourceTemplateDir;
            logger.warn(`Using source templates from: ${templateDir}`);
          } else {
            logger.error(
              `Template directory not found. Tried: ${join(__dirname, 'templates')} and ${sourceTemplateDir}`,
            );
          }
        } else {
          logger.log(`Using templates from: ${templateDir}`);
        }

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailPort === 465,
            auth: {
              user: mailUser,
              pass: mailPass,
            },
            // Handle self-signed certificates
            // In development: default to allowing self-signed certs (rejectUnauthorized: false)
            //   unless MAIL_REJECT_UNAUTHORIZED=true is explicitly set
            // In production: always reject unauthorized certificates for security
            tls: {
              rejectUnauthorized:
                process.env.NODE_ENV === 'production'
                  ? true
                  : configService.get<string>('MAIL_REJECT_UNAUTHORIZED') ===
                    'true',
            },
          },
          defaults: {
            from: `"Flexify" <${mailFrom}>`,
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
