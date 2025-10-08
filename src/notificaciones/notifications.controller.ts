import { Controller, Get, Post, Query, Param, Body, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailService } from './channels/email.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Get('/user/:userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationsService.getNotificationsByUser(userId, page, limit);
  }

  @Get('/stats')
  async getStats() {
    return this.notificationsService.getNotificationStats();
  }

  @Post('/retry-failed')
  async retryFailedNotifications() {
    await this.notificationsService.retryFailedNotifications();
    return { message: 'Failed notifications retry initiated' };
  }

  @Get('/health/email')
  async checkEmailHealth() {
    const isHealthy = await this.emailService.testConnection();
    return {
      service: 'email',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('/test/email')
  async testEmail(@Body() body: { to: string; subject?: string; content?: string }) {
    const success = await this.emailService.sendEmail({
      to: body.to,
      subject: body.subject || 'Test Email',
      html: body.content || '<h1>This is a test email from TITEC Notifications Service</h1>',
    });

    return {
      success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
    };
  }
}