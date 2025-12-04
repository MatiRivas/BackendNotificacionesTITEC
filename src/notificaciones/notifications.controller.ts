import { Controller, Get, Post, Query, Param, Body, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailService } from './channels/email.service';
import { EventsListenerService } from '../external/events-listener.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly eventsListenerService: EventsListenerService,
  ) {}

  // ===== NUEVOS ENDPOINTS PARA BD ACTUAL =====

  @Post('/test-create')
  async testCreateNotification(@Body() body: {
    id_emisor: string;
    id_receptor: string;
    id_plantilla: number;
    channel_ids: number[];
    context?: any;
  }) {
    this.logger.log('Testing notification creation...');
    return this.notificationsService.createSimpleNotification(body);
  }

  @Get('/templates')
  async getAllTemplates() {
    return this.notificationsService.getAllTemplates();
  }

  @Get('/channels')
  async getAllChannels() {
    return this.notificationsService.getAllChannels();
  }

  @Get('/template-types')
  async getAllTemplateTypes() {
    return this.notificationsService.getAllTemplateTypes();
  }

  @Post('/create')
  async createNotification(@Body() body: {
    id_emisor: number;
    id_receptor: number;
    id_plantilla: number;
    channel_ids: number[];
  }) {
    return this.notificationsService.createNotification(body);
  }

  @Get('/user/:userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Intentar como string primero (para UUIDs como "seller-test-456")
    const stringResult = await this.notificationsService.getNotificationsByUser(userId, page, limit);
    
    // Si no hay resultados y el userId parece ser un número, intentar como número
    if ((!stringResult || stringResult.length === 0) && !isNaN(Number(userId))) {
      const userIdNumber = parseInt(userId);
      return this.notificationsService.getNotificationsByUserId(userIdNumber, page, limit);
    }
    
    return stringResult;
  }

  @Get('/stats')
  async getStats() {
    return this.notificationsService.getBasicNotificationStats();
  }

  @Post('/notificacion_leida/:notificationId')
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string
  ) {
    return this.notificationsService.markNotificationAsRead(notificationId);
  }

  @Post('/notificaciones_leidas')
  async markMultipleNotificationsAsRead(
    @Body() body: { notificationIds: string[] }
  ) {
    if (!body.notificationIds || !Array.isArray(body.notificationIds)) {
      return {
        success: false,
        message: 'Se requiere un array de IDs de notificaciones',
        updated: 0
      };
    }
    
    return this.notificationsService.markMultipleNotificationsAsRead(body.notificationIds);
  }

  // ===== NUEVO ENDPOINT PARA CHANGE STREAMS =====

  @Get('/listener-status')
  async getListenerStatus() {
    const listenerStats = this.eventsListenerService.getListenerStats();
    const notificationStats = await this.notificationsService.getBasicNotificationStats();
    
    return {
      changeStreams: listenerStats,
      notifications: notificationStats,
      integration: {
        active: listenerStats.connected && listenerStats.ordersStreamActive && listenerStats.paymentsStreamActive,
        message: listenerStats.connected ? 
          '🎧 Escuchando eventos en tiempo real' : 
          '❌ Change Streams desconectados'
      }
    };
  }

  // ===== ENDPOINTS EXISTENTES (para compatibilidad) =====

  @Get('/user-history/:userId')
  async getUserNotificationsHistory(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationsService.getNotificationsByUser(userId, page, limit);
  }

  @Get('/history-stats')
  async getHistoryStats() {
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