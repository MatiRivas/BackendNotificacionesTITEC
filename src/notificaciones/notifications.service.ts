import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { 
  NotificationHistory, 
  NotificationHistoryDocument, 
  NotificationHistoryStatus,
  NotificationChannel,
  NotificationPriority 
} from './schemas/notification-history.schema';
import { CreateNotificationFromEventDto } from './dto/notification-context.dto';
import { EmailService } from './channels/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationHistory.name)
    private notificationModel: Model<NotificationHistoryDocument>,
    private emailService: EmailService,
  ) {}

  async createNotificationFromEvent(dto: CreateNotificationFromEventDto): Promise<NotificationHistory[]> {
    const notifications: NotificationHistory[] = [];
    const eventId = randomUUID();

    this.logger.log(`Creating notifications for event: ${dto.eventType}, recipients: ${dto.recipients.length}`);

    for (const recipient of dto.recipients) {
      const channels = dto.channels || ['email'];
      
      for (const channelName of channels) {
        try {
          // Generar contenido de la notificación
          const content = await this.generateNotificationContent(
            dto.templateType,
            dto.eventData,
            recipient.role,
            channelName
          );

          // Crear registro en la base de datos
          const notification = new this.notificationModel({
            eventId,
            eventType: dto.eventType,
            userId: recipient.userId,
            email: recipient.email,
            phone: recipient.phone,
            templateType: dto.templateType,
            channel: channelName as NotificationChannel,
            priority: dto.priority || NotificationPriority.MEDIUM,
            status: NotificationHistoryStatus.PENDING,
            subject: content.subject,
            content: content.body,
            eventData: dto.eventData,
            attempts: 0,
          });

          const savedNotification = await notification.save();
          notifications.push(savedNotification);

          // Enviar notificación de forma asíncrona
          this.sendNotificationAsync(savedNotification);

        } catch (error) {
          this.logger.error(`Error creating notification for user ${recipient.userId} via ${channelName}:`, error);
        }
      }
    }

    this.logger.log(`Created ${notifications.length} notifications for event ${eventId}`);
    return notifications;
  }

  private async sendNotificationAsync(notification: NotificationHistoryDocument) {
    try {
      await this.updateNotificationStatus(notification.id, NotificationHistoryStatus.PENDING);
      
      let success = false;
      
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          if (notification.email) {
            success = await this.emailService.sendEmail({
              to: notification.email,
              subject: notification.subject,
              html: notification.content,
              context: notification.eventData,
            });
          }
          break;
        
        case NotificationChannel.SMS:
          // TODO: Implementar SMS service
          this.logger.warn('SMS service not implemented yet');
          break;
          
        case NotificationChannel.PUSH:
          // TODO: Implementar push notification service  
          this.logger.warn('Push notification service not implemented yet');
          break;
          
        default:
          this.logger.warn(`Unknown notification channel: ${notification.channel}`);
      }

      if (success) {
        await this.updateNotificationStatus(
          notification.id, 
          NotificationHistoryStatus.SENT,
          { sentAt: new Date() }
        );
        this.logger.log(`Notification sent successfully: ${notification.id}`);
      } else {
        await this.updateNotificationStatus(
          notification.id, 
          NotificationHistoryStatus.FAILED,
          { 
            errorMessage: 'Failed to send notification',
            attempts: notification.attempts + 1 
          }
        );
        this.logger.error(`Failed to send notification: ${notification.id}`);
      }
    } catch (error) {
      this.logger.error(`Error sending notification ${notification._id}:`, error);
      await this.updateNotificationStatus(
        notification.id, 
        NotificationHistoryStatus.FAILED,
        { 
          errorMessage: error.message,
          attempts: notification.attempts + 1 
        }
      );
    }
  }

  private async updateNotificationStatus(
    notificationId: string, 
    status: NotificationHistoryStatus,
    extraData: any = {}
  ) {
    await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { 
        status,
        ...extraData,
        updatedAt: new Date()
      }
    );
  }

  private async generateNotificationContent(
    templateType: string,
    eventData: any,
    recipientRole: string,
    channel: string
  ): Promise<{ subject: string; body: string }> {
    // Por ahora retornamos contenido básico, luego implementaremos templates
    const templates = {
      new_order_seller: {
        subject: `Nueva orden recibida - #${eventData.orderId}`,
        body: `¡Tienes una nueva orden! El comprador ha realizado una compra por $${eventData.totalAmount}. Revisa los detalles y prepara el envío.`
      },
      order_confirmation_buyer: {
        subject: `Confirmación de compra - #${eventData.orderId}`,
        body: `Tu compra ha sido confirmada exitosamente. Total: $${eventData.totalAmount}. Te notificaremos cuando el vendedor prepare tu pedido.`
      },
      order_status_seller: {
        subject: `Estado de orden actualizado - #${eventData.orderId}`,
        body: `El estado de tu orden ha cambiado a: ${eventData.newStatus}. Mantente al tanto de los próximos pasos.`
      },
      order_shipped_buyer: {
        subject: `¡Tu pedido fue enviado! - #${eventData.orderId}`,
        body: `¡Buenas noticias! Tu pedido ha sido enviado. Número de seguimiento: ${eventData.trackingNumber || 'N/A'}`
      },
      payment_confirmed_seller: {
        subject: `Pago confirmado - #${eventData.orderId}`,
        body: `El pago de $${eventData.amount} ha sido confirmado. Puedes proceder con el envío del producto.`
      }
    };

    return templates[templateType] || {
      subject: 'Notificación',
      body: 'Tienes una nueva notificación.'
    };
  }

  // Métodos para consultar notificaciones
  async getNotificationsByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async getNotificationStats() {
    const stats = await this.notificationModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const channelStats = await this.notificationModel.aggregate([
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      byStatus: stats,
      byChannel: channelStats,
      total: await this.notificationModel.countDocuments()
    };
  }

  async retryFailedNotifications() {
    const failedNotifications = await this.notificationModel
      .find({ 
        status: NotificationHistoryStatus.FAILED,
        attempts: { $lt: 3 } // Máximo 3 intentos
      })
      .exec();

    this.logger.log(`Retrying ${failedNotifications.length} failed notifications`);

    for (const notification of failedNotifications) {
      await this.sendNotificationAsync(notification);
    }
  }
}