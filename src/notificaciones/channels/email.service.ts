import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  context?: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Si no hay configuración completa de SMTP, usar modo desarrollo
    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP configuration incomplete. Email service running in development mode.');
      this.logger.warn('Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env for email functionality');
      
      // Crear un transporter que no falle
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
      return;
    }

    const smtpConfig = {
      host: smtpHost,
      port: smtpPort || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: false,
      debug: false,
    };

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verificar la configuración
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP configuration error:');
        this.logger.error(error.message || error);
        this.logger.warn('Email service will continue in mock mode for development');
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      this.logger.log(`Sending email to: ${options.to}`);

      const mailOptions = {
        from: this.configService.get<string>('SMTP_USER'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${options.to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    this.logger.log(`Bulk email results: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection test successful');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection test failed:', error);
      return false;
    }
  }
}
