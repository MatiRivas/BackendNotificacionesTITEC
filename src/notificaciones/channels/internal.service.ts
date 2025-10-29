import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { NotificationChannel } from './channel.interface';

/**
 * 📱 Servicio de Notificaciones Internas
 * Implementa HDU6: "Si falla el envío de correo, debe verse la notificación interna"
 * 
 * Las notificaciones internas se almacenan en la BD y se muestran en la aplicación
 * cuando otros canales (email, SMS, push) fallan.
 */
@Injectable()
export class InternalNotificationService implements NotificationChannel {
  private readonly logger = new Logger(InternalNotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * 📤 Envía una notificación (método de la interfaz NotificationChannel)
   * @param to - Usuario destinatario
   * @param subject - Asunto de la notificación
   * @param content - Contenido de la notificación
   * @param context - Contexto adicional
   * @returns Promise<boolean>
   */
  async send(to: string, subject: string, content: string, context?: any): Promise<boolean> {
    return this.sendNotification({
      userId: to,
      title: subject,
      content,
      metadata: context || {}
    });
  }

  /**
   * 📤 Envía una notificación interna
   * @param notification - Datos de la notificación
   * @returns Promise<boolean> - true si se guardó correctamente
   */
  async sendNotification(notification: any): Promise<boolean> {
    try {
      // Crear notificación interna en la base de datos
      const internalNotification = new this.notificationModel({
        ...notification,
        channel: 'internal',
        status: 'sent',
        sentAt: new Date(),
        isRead: false,
        metadata: {
          ...notification.metadata,
          isInternalFallback: true,
          originalChannel: notification.originalChannel || 'unknown'
        }
      });

      await internalNotification.save();

      this.logger.log(
        `Notificación interna creada para usuario ${notification.userId}. ` +
        `ID: ${internalNotification._id}`
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error enviando notificación interna para usuario ${notification.userId}:`,
        error.stack
      );
      return false;
    }
  }

  /**
   * 📥 Obtiene notificaciones internas no leídas de un usuario
   * @param userId - ID del usuario
   * @returns Promise<NotificationDocument[]>
   */
  async getUnreadInternalNotifications(userId: string): Promise<NotificationDocument[]> {
    try {
      const notifications = await this.notificationModel
        .find({
          userId,
          channel: 'internal',
          isRead: false,
          status: 'sent'
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .exec();

      this.logger.log(
        `Obtenidas ${notifications.length} notificaciones internas no leídas para usuario ${userId}`
      );

      return notifications;
    } catch (error) {
      this.logger.error(
        `Error obteniendo notificaciones internas para usuario ${userId}:`,
        error.stack
      );
      return [];
    }
  }

  /**
   * ✅ Marca una notificación como leída
   * @param notificationId - ID de la notificación
   * @param userId - ID del usuario (para validación)
   * @returns Promise<boolean>
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationModel.updateOne(
        {
          _id: notificationId,
          userId,
          channel: 'internal'
        },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        this.logger.warn(
          `Notificación ${notificationId} no encontrada para usuario ${userId}`
        );
        return false;
      }

      this.logger.log(
        `Notificación ${notificationId} marcada como leída para usuario ${userId}`
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error marcando notificación ${notificationId} como leída:`,
        error.stack
      );
      return false;
    }
  }

  /**
   * 📊 Obtiene estadísticas de notificaciones internas
   * @param userId - ID del usuario
   * @returns Promise<object>
   */
  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    fallbackCount: number;
  }> {
    try {
      const [total, unread, fallbackCount] = await Promise.all([
        this.notificationModel.countDocuments({ userId, channel: 'internal' }),
        this.notificationModel.countDocuments({ 
          userId, 
          channel: 'internal', 
          isRead: false 
        }),
        this.notificationModel.countDocuments({ 
          userId, 
          channel: 'internal',
          'metadata.isInternalFallback': true
        })
      ]);

      return { total, unread, fallbackCount };
    } catch (error) {
      this.logger.error(
        `Error obteniendo estadísticas para usuario ${userId}:`,
        error.stack
      );
      return { total: 0, unread: 0, fallbackCount: 0 };
    }
  }

  /**
   * 🧹 Limpia notificaciones antiguas leídas (más de 30 días)
   * @returns Promise<number> - Número de notificaciones eliminadas
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.notificationModel.deleteMany({
        channel: 'internal',
        isRead: true,
        readAt: { $lt: thirtyDaysAgo }
      });

      this.logger.log(
        `Limpieza completada: ${result.deletedCount} notificaciones eliminadas`
      );

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error('Error en limpieza de notificaciones:', error.stack);
      return 0;
    }
  }
}