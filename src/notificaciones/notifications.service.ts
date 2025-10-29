import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';

// Schemas existentes
import { 
  NotificationHistory, 
  NotificationHistoryDocument, 
  NotificationHistoryStatus,
  NotificationChannel,
  NotificationPriority 
} from './schemas/notification-history.schema';

// Nuevos schemas para BD actual
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Template, TemplateDocument } from './schemas/template.schema';
import { ChannelType, ChannelTypeDocument } from './schemas/channel-type.schema';
import { TemplateType, TemplateTypeDocument } from './schemas/template-type.schema';

import { CreateNotificationFromEventDto } from './dto/notification-context.dto';
import { EmailService } from './channels/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationHistory.name)
    private notificationHistoryModel: Model<NotificationHistoryDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
    @InjectModel(ChannelType.name)
    private channelTypeModel: Model<ChannelTypeDocument>,
    @InjectModel(TemplateType.name)
    private templateTypeModel: Model<TemplateTypeDocument>,
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
          const notification = new this.notificationHistoryModel({
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
    await this.notificationHistoryModel.findByIdAndUpdate(
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
    
    return this.notificationHistoryModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async getNotificationStats() {
    const stats = await this.notificationHistoryModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const channelStats = await this.notificationHistoryModel.aggregate([
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
      total: await this.notificationHistoryModel.countDocuments()
    };
  }

  async retryFailedNotifications() {
    const failedNotifications = await this.notificationHistoryModel
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

  // ===== NUEVOS MÉTODOS PARA LA BD ACTUAL =====
  
  // Consultar todas las plantillas
  async getAllTemplates() {
    this.logger.log('🔍 Buscando plantillas en colección: plantillas');
    const templates = await this.templateModel.find().exec();
    this.logger.log(`📋 Plantillas encontradas: ${templates.length}`);
    return templates;
  }

  // Consultar todos los canales
  async getAllChannels() {
    return this.channelTypeModel.find().exec();
  }

  // Consultar todos los tipos de plantillas
  async getAllTemplateTypes() {
    return this.templateTypeModel.find().exec();
  }

  // Crear una nueva notificación
  async createNotification(data: {
    id_emisor: number;
    id_receptor: number;
    id_plantilla: number;
    channel_ids: number[];
  }) {
    // Generar nuevo ID
    const lastNotification = await this.notificationModel
      .findOne()
      .sort({ id_notificacion: -1 })
      .exec();
    
    const newId = lastNotification ? lastNotification.id_notificacion + 1 : 1;

    const notification = new this.notificationModel({
      id_notificacion: newId,
      fecha_hora: new Date(),
      id_emisor: data.id_emisor,
      id_receptor: data.id_receptor,
      id_plantilla: data.id_plantilla,
      channel_ids: data.channel_ids,
      estado: 'pendiente'
    });

    return notification.save();
  }

  // Consultar notificaciones por usuario (actualizado para nueva BD)
  async getNotificationsByUserId(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    return this.notificationModel
      .find({ id_receptor: userId })
      .sort({ fecha_hora: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  // Estadísticas básicas de notificaciones
  async getBasicNotificationStats() {
    const stats = await this.notificationModel.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      byStatus: stats,
      total: await this.notificationModel.countDocuments()
    };
  }
}