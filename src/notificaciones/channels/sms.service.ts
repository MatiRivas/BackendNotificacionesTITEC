import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, SMSOptions } from './channel.interface';

@Injectable()
export class SmsService implements NotificationChannel {
  private readonly logger = new Logger(SmsService.name);

  async send(to: string, subject: string, content: string): Promise<boolean> {
    try {
      // TODO: Implementar integración con proveedor SMS (Twilio, AWS SNS, etc.)
      this.logger.log(`SMS would be sent to: ${to}`);
      this.logger.log(`Content: ${content}`);
      
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.logger.log(`SMS sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  async sendSMS(options: SMSOptions): Promise<boolean> {
    return this.send(options.to, '', options.message);
  }

  async testConnection(): Promise<boolean> {
    this.logger.log('SMS service connection test - OK (simulated)');
    return true;
  }
}
