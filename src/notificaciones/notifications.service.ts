import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas actualizados para tu BD
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Template, TemplateDocument, TemplateType, TemplateTypeDocument } from './schemas/template.schema';
import { Channel, ChannelDocument } from './schemas/channel.schema';

import { EmailService } from './channels/email.service';
import { UsersApiService } from '../external/users-api.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
    @InjectModel(TemplateType.name)
    private templateTypeModel: Model<TemplateTypeDocument>,
    @InjectModel(Channel.name)
    private channelModel: Model<ChannelDocument>,
    private emailService: EmailService,
    private usersApiService: UsersApiService,
  ) {}

  /**
   * Crear notificación simple con tu estructura actual (SIN cache)
   */
  async createSimpleNotification(data: {
    id_emisor: string;
    id_receptor: string;
    id_plantilla: number;
    channel_ids: number[]; // Array de canales a usar
    context?: any;
  }): Promise<Notification> {
    try {
      // 1. Verificar que la plantilla existe
      const plantilla = await this.templateModel.findOne({ 
        id_Plantilla: data.id_plantilla 
      }).exec();
      
      if (!plantilla) {
        throw new Error(`Template ${data.id_plantilla} not found`);
      }

      // 2. Verificar que los canales existen
      const canales = await this.channelModel.find({ 
        id_canal: { $in: data.channel_ids }
      }).exec();
      
      if (canales.length !== data.channel_ids.length) {
        throw new Error('One or more channels not found');
      }

      // 3. Generar ID único de notificación
      const nextId = await this.getNextNotificationId();

      // 4. Crear notificación SIN cache (más simple)
      const notification = new this.notificationModel({
        id_notificacion: nextId,
        fecha_hora: new Date(),
        id_emisor: data.id_emisor,
        id_receptor: data.id_receptor,
        id_plantilla: data.id_plantilla,
        channel_ids: data.channel_ids,
        estado: 'pendiente',
      });

      const saved = await notification.save();
      this.logger.log(`Created notification ${saved.id_notificacion} for user ${data.id_receptor}`);
      
      return saved;
    } catch (error) {
      this.logger.error(`Error creating notification:`, error);
      throw error;
    }
  }

  /**
   * Generar próximo ID de notificación
   */
  private async getNextNotificationId(): Promise<number> {
    const lastNotification = await this.notificationModel
      .findOne({}, {}, { sort: { id_notificacion: -1 } })
      .exec();
    
    return lastNotification ? lastNotification.id_notificacion + 1 : 1;
  }

  /**
   * Enviar notificación por todos sus canales
   */
  async sendNotification(notificationId: string): Promise<void> {
    try {
      // 1. Buscar notificación
      const notification = await this.notificationModel.findById(notificationId).exec();
      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      // 2. Obtener datos del receptor SIEMPRE desde API (sin cache)
      const receptorData = await this.usersApiService.getUser(notification.id_receptor);

      // 3. Obtener plantilla
      const template = await this.templateModel.findOne({
        id_Plantilla: notification.id_plantilla
      }).exec();

      if (!template) {
        throw new Error(`Template ${notification.id_plantilla} not found`);
      }

      // 4. Enviar por cada canal
      let enviadoExitoso = false;
      for (const canalId of notification.channel_ids) {
        try {
          const canal = await this.channelModel.findOne({ id_canal: canalId }).exec();
          if (!canal) {
            this.logger.warn(`Channel ${canalId} not found`);
            continue;
          }
          await this.notificationModel.findByIdAndUpdate(notificationId, {
            receptor_cache: receptorData
          });
        } catch (error) {
          this.logger.error(`Could not get user data for ${notification.id_receptor}`);
          if (!receptorData) {
            throw new Error('No user data available for sending notification');
          }
        }
      }

      // Obtener plantilla
      const plantilla = await this.templateModel.findOne({
        id_Plantilla: notification.id_plantilla
      }).exec();

      if (!plantilla) {
        throw new Error(`Template ${notification.id_plantilla} not found`);
      }

      // 4. Enviar por cada canal
      let successfulSend = false;
      for (const canalId of notification.channel_ids) {
        try {
          const canal = await this.channelModel.findOne({ id_canal: canalId }).exec();
          if (!canal) {
            this.logger.warn(`Channel ${canalId} not found`);
            continue;
          }

          // Enviar según el tipo de canal
          switch (canal.tipo_canal.toLowerCase()) {
            case 'email':
              if (receptorData.email) {
                await this.emailService.sendEmail({
                  to: receptorData.email,
                  subject: template.asunto_base || 'Notificación',
                  html: template.descripción_base,
                  context: {}, // Context para plantillas dinámicas si es necesario
                });
                successfulSend = true;
                this.logger.log(`Email sent to ${receptorData.email}`);
              }
              break;
              
            case 'sms':
              if (receptorData.telefono) {
                this.logger.log(`SMS would be sent to ${receptorData.telefono}: ${template.descripción_base}`);
                // TODO: Implementar SMS service
                successfulSend = true;
              }
              break;
              
            case 'push':
              if (receptorData.push_token) {
                this.logger.log(`Push would be sent to ${receptorData.push_token}: ${template.descripción_base}`);
                // TODO: Implementar Push service
                successfulSend = true;
              }
              break;
              
            default:
              this.logger.warn(`Unknown channel type: ${canal.tipo_canal}`);
          }
        } catch (error) {
          this.logger.error(`Error sending via channel ${canalId}:`, error);
        }
      }

      // Actualizar estado
      await this.notificationModel.findByIdAndUpdate(notificationId, {
        estado: successfulSend ? 'enviado' : 'fallido'
      });

    } catch (error) {
      this.logger.error(`Error sending notification ${notificationId}:`, error);
      await this.notificationModel.findByIdAndUpdate(notificationId, {
        estado: 'fallido'
      });
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return this.notificationModel
      .find({ id_receptor: userId })
      .sort({ fecha_hora: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Estadísticas básicas
   */
  async getStats() {
    const total = await this.notificationModel.countDocuments();
    const pendientes = await this.notificationModel.countDocuments({ estado: 'pendiente' });
    const enviados = await this.notificationModel.countDocuments({ estado: 'enviado' });
    const fallidos = await this.notificationModel.countDocuments({ estado: 'fallido' });

    return {
      total,
      pendientes,
      enviados, 
      fallidos,
      byStatus: {
        pendiente: pendientes,
        enviado: enviados,
        fallido: fallidos
      },
      byChannel: {
        // Esto requeriría agregación más compleja, por ahora básico
        email: 0,
        sms: 0,
        push: 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check para email
   */
  async healthCheckEmail(): Promise<boolean> {
    try {
      // Implementar test de conectividad de email
      return true;
    } catch (error) {
      this.logger.error('Email health check failed:', error);
      return false;
    }
  }

  /**
   * Métodos de compatibilidad para mantener funcionalidad existente
   */
  
  // Alias para compatibilidad con consumers
  async createNotificationFromEvent(data: {
    eventType: string;
    recipients: Array<{ userId: string; email?: string; phone?: string; role?: string }>;
    channels?: string[];
    priority?: string;
    templateData?: any;
    eventData?: any; // Para compatibilidad
    templateType?: string; // Para compatibilidad
  }) {
    this.logger.log(`Creating notifications for event: ${data.eventType}`);
    
    const notifications = [];
    
    for (const recipient of data.recipients) {
      try {
        // Mapear el tipo de evento a ID de plantilla
        const plantillaId = this.mapEventToTemplate(data.eventType);
        
        const notification = await this.createSimpleNotification({
          id_emisor: 'system', // Para eventos del sistema
          id_receptor: recipient.userId,
          id_plantilla: plantillaId,
          channel_ids: [1, 2], // Email y SMS por defecto para eventos
          context: data.templateData
        });
        
        notifications.push(notification);
      } catch (error) {
        this.logger.error(`Error creating notification for ${recipient.userId}:`, error);
      }
    }
    
    return notifications;
  }

  // Mapeo de eventos a plantillas
  private mapEventToTemplate(eventType: string): number {
    const mapping = {
      'order_created': 1,
      'order_confirmed': 2, 
      'order_status_changed': 3,
      'order_shipped': 4,
      'order_cancelled': 5,
      'payment_confirmed': 6,
      'payment_rejected': 6,
      'payment_issue': 7,
    };
    
    return mapping[eventType] || 1; // Default a plantilla 1
  }

  // Métodos para el controller
  async getAllTemplates() {
    return this.templateModel.find().exec();
  }

  async getAllChannels() {
    return this.channelModel.find().exec();
  }

  async getAllTemplateTypes() {
    return this.templateTypeModel.find().exec();
  }

  async createNotification(data: any) {
    return this.createSimpleNotification(data);
  }

  async getNotificationsByUserId(userId: number, page = 1, limit = 20) {
    return this.getUserNotifications(userId.toString(), limit);
  }

  async getBasicNotificationStats() {
    return this.getStats();
  }

  async getNotificationsByUser(userId: string, page = 1, limit = 20) {
    return this.getUserNotifications(userId, limit);
  }

  async getNotificationStats() {
    return this.getStats();
  }

  async retryFailedNotifications() {
    const failedNotifications = await this.notificationModel
      .find({ estado: 'fallido' })
      .limit(10)
      .exec();

    for (const notification of failedNotifications) {
      try {
        await this.sendNotification(notification._id.toString());
      } catch (error) {
        this.logger.error(`Failed to retry notification ${notification._id}:`, error);
      }
    }

    return { retriedCount: failedNotifications.length };
  }
}