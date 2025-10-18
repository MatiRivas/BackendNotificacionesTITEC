import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

/**
 * 🔄 Servicio de Fallback para Notificaciones
 * Implementa HDU7: "En caso de error... se reintenta por otro canal"
 * 
 * Maneja la lógica de reintento automático cuando un canal falla.
 */
@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name);

  // Orden de fallback por defecto: email → push → sms → internal
  private readonly DEFAULT_FALLBACK_ORDER = ['email', 'push', 'sms', 'internal'];

  // Configuración de reintentos por canal
  private readonly RETRY_CONFIG = {
    email: { maxRetries: 2, retryDelay: 5000 },    // 2 intentos, 5 segundos
    push: { maxRetries: 1, retryDelay: 3000 },     // 1 intento, 3 segundos
    sms: { maxRetries: 1, retryDelay: 2000 },      // 1 intento, 2 segundos
    internal: { maxRetries: 3, retryDelay: 1000 }  // 3 intentos, 1 segundo
  };

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * 🔄 Ejecuta estrategia de fallback para una notificación
   * @param notificationId - ID de la notificación original
   * @param originalChannel - Canal que falló
   * @param userPreferences - Preferencias del usuario
   * @param channelServices - Servicios de canales disponibles
   * @returns Promise<boolean> - true si el fallback fue exitoso
   */
  async executeFailover(
    notificationId: string,
    originalChannel: string,
    userPreferences: string[],
    channelServices: any,
    notificationData: any
  ): Promise<boolean> {
    try {
      const fallbackChannels = this.getFallbackChannels(originalChannel, userPreferences);
      
      this.logger.log(
        `Iniciando fallback para notificación ${notificationId}. ` +
        `Canal original: ${originalChannel}, Canales fallback: ${fallbackChannels.join(', ')}`
      );

      for (const channel of fallbackChannels) {
        const success = await this.attemptChannelWithRetry(
          channel,
          channelServices,
          notificationData,
          notificationId
        );

        if (success) {
          await this.recordFallbackSuccess(notificationId, originalChannel, channel);
          this.logger.log(
            `Fallback exitoso para notificación ${notificationId}: ${originalChannel} → ${channel}`
          );
          return true;
        }
      }

      // Si todos los fallbacks fallan, registrar el error
      await this.recordFallbackFailure(notificationId, originalChannel, fallbackChannels);
      this.logger.error(
        `Todos los fallbacks fallaron para notificación ${notificationId}`
      );

      return false;
    } catch (error) {
      this.logger.error(
        `Error ejecutando fallback para notificación ${notificationId}:`,
        error.stack
      );
      return false;
    }
  }

  /**
   * 🎯 Determina los canales de fallback disponibles
   * @param originalChannel - Canal que falló
   * @param userPreferences - Canales preferidos del usuario
   * @returns string[] - Lista de canales para intentar
   */
  private getFallbackChannels(originalChannel: string, userPreferences: string[]): string[] {
    // Combinar preferencias del usuario con orden por defecto
    const availableChannels = [...new Set([...userPreferences, ...this.DEFAULT_FALLBACK_ORDER])];
    
    // Remover el canal original que falló
    const fallbackChannels = availableChannels.filter(channel => channel !== originalChannel);
    
    // Siempre incluir 'internal' como último recurso si no está presente
    if (!fallbackChannels.includes('internal')) {
      fallbackChannels.push('internal');
    }

    return fallbackChannels;
  }

  /**
   * 🔁 Intenta enviar por un canal específico con reintentos
   * @param channel - Canal a intentar
   * @param channelServices - Servicios disponibles
   * @param notificationData - Datos de la notificación
   * @param notificationId - ID de la notificación
   * @returns Promise<boolean>
   */
  private async attemptChannelWithRetry(
    channel: string,
    channelServices: any,
    notificationData: any,
    notificationId: string
  ): Promise<boolean> {
    const service = channelServices[channel];
    if (!service) {
      this.logger.warn(`Servicio no disponible para canal: ${channel}`);
      return false;
    }

    const config = this.RETRY_CONFIG[channel] || { maxRetries: 1, retryDelay: 1000 };
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        this.logger.log(
          `Intento ${attempt}/${config.maxRetries} para canal ${channel} ` +
          `(notificación ${notificationId})`
        );

        let success = false;

        // Usar el método específico del servicio según el canal
        if (service.sendNotification) {
          success = await service.sendNotification({
            ...notificationData,
            channel,
            originalChannel: notificationData.channel || 'unknown'
          });
        } else if (service.send) {
          success = await service.send(
            notificationData.userId,
            notificationData.title || notificationData.subject,
            notificationData.content,
            notificationData.metadata
          );
        }

        if (success) {
          this.logger.log(
            `Éxito en intento ${attempt} para canal ${channel} ` +
            `(notificación ${notificationId})`
          );
          return true;
        }

        // Esperar antes del siguiente intento (excepto en el último)
        if (attempt < config.maxRetries) {
          await this.delay(config.retryDelay);
        }

      } catch (error) {
        this.logger.warn(
          `Intento ${attempt}/${config.maxRetries} falló para canal ${channel}: ${error.message}`
        );
      }
    }

    return false;
  }

  /**
   * ✅ Registra un fallback exitoso en la base de datos
   */
  private async recordFallbackSuccess(
    notificationId: string,
    originalChannel: string,
    successChannel: string
  ): Promise<void> {
    try {
      await this.notificationModel.updateOne(
        { _id: notificationId },
        {
          $set: {
            status: 'sent',
            channel: successChannel,
            sentAt: new Date()
          },
          $push: {
            'metadata.fallbackHistory': {
              originalChannel,
              successChannel,
              timestamp: new Date(),
              success: true
            }
          }
        }
      );
    } catch (error) {
      this.logger.error('Error registrando fallback exitoso:', error.stack);
    }
  }

  /**
   * ❌ Registra un fallback fallido en la base de datos
   */
  private async recordFallbackFailure(
    notificationId: string,
    originalChannel: string,
    attemptedChannels: string[]
  ): Promise<void> {
    try {
      await this.notificationModel.updateOne(
        { _id: notificationId },
        {
          $set: {
            status: 'failed',
            failedAt: new Date()
          },
          $push: {
            'metadata.fallbackHistory': {
              originalChannel,
              attemptedChannels,
              timestamp: new Date(),
              success: false
            }
          }
        }
      );
    } catch (error) {
      this.logger.error('Error registrando fallback fallido:', error.stack);
    }
  }

  /**
   * ⏱️ Utilidad para delay en reintentos
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 Obtiene estadísticas de fallback
   * @param userId - ID del usuario (opcional)
   * @returns Promise<object>
   */
  async getFallbackStats(userId?: string): Promise<{
    totalFallbacks: number;
    successfulFallbacks: number;
    failedFallbacks: number;
    topFailingChannels: Array<{ channel: string; count: number }>;
  }> {
    try {
      const matchCondition = userId ? { userId } : {};

      const [stats] = await this.notificationModel.aggregate([
        { $match: { ...matchCondition, 'metadata.fallbackHistory': { $exists: true } } },
        {
          $project: {
            fallbackHistory: '$metadata.fallbackHistory',
            originalChannel: 1
          }
        },
        {
          $unwind: '$fallbackHistory'
        },
        {
          $group: {
            _id: null,
            totalFallbacks: { $sum: 1 },
            successfulFallbacks: {
              $sum: { $cond: ['$fallbackHistory.success', 1, 0] }
            },
            failedFallbacks: {
              $sum: { $cond: ['$fallbackHistory.success', 0, 1] }
            },
            channelFailures: {
              $push: '$fallbackHistory.originalChannel'
            }
          }
        }
      ]);

      const topFailingChannels = stats ? 
        this.calculateTopFailingChannels(stats.channelFailures) : [];

      return {
        totalFallbacks: stats?.totalFallbacks || 0,
        successfulFallbacks: stats?.successfulFallbacks || 0,
        failedFallbacks: stats?.failedFallbacks || 0,
        topFailingChannels
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de fallback:', error.stack);
      return {
        totalFallbacks: 0,
        successfulFallbacks: 0,
        failedFallbacks: 0,
        topFailingChannels: []
      };
    }
  }

  /**
   * 📈 Calcula los canales que más fallan
   */
  private calculateTopFailingChannels(channelFailures: string[]): Array<{ channel: string; count: number }> {
    const counts = channelFailures.reduce((acc, channel) => {
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([channel, count]) => ({ channel, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}