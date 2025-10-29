import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../channels/email.service';
import { SmsService } from '../channels/sms.service';
import { PushService } from '../channels/push.service';
import { InternalNotificationService } from '../channels/internal.service';
import { FallbackService } from './fallback.service';

/**
 * 🎛️ Gestor de Canales de Notificación
 * Implementa HDU7: Selección inteligente de canales basada en preferencias
 * 
 * Coordina el envío entre múltiples canales y maneja fallbacks automáticos.
 */
@Injectable()
export class ChannelManagerService {
  private readonly logger = new Logger(ChannelManagerService.name);

  // Mapeo de servicios de canales
  private readonly channelServices = {
    email: null,    // Se inyectará en constructor
    sms: null,      // Se inyectará en constructor  
    push: null,     // Se inyectará en constructor
    internal: null  // Se inyectará en constructor
  };

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly internalService: InternalNotificationService,
    private readonly fallbackService: FallbackService,
  ) {
    // Configurar servicios de canales
    this.channelServices.email = this.emailService;
    this.channelServices.sms = this.smsService;
    this.channelServices.push = this.pushService;
    this.channelServices.internal = this.internalService;
  }

  /**
   * 📤 Envía notificación por el canal óptimo
   * @param notificationData - Datos de la notificación
   * @param userPreferences - Preferencias del usuario
   * @returns Promise<{ success: boolean; channel: string; fallbackUsed?: boolean }>
   */
  async sendNotification(
    notificationData: any,
    userPreferences?: string[]
  ): Promise<{ success: boolean; channel: string; fallbackUsed?: boolean }> {
    try {
      // Determinar el canal óptimo basado en preferencias
      const optimalChannel = this.selectOptimalChannel(
        notificationData.type,
        userPreferences || ['email', 'internal']
      );

      this.logger.log(
        `Enviando notificación ${notificationData.id || 'nueva'} por canal: ${optimalChannel}`
      );

      // Intentar envío por el canal óptimo
      const primarySuccess = await this.attemptSend(optimalChannel, notificationData);

      if (primarySuccess) {
        return {
          success: true,
          channel: optimalChannel,
          fallbackUsed: false
        };
      }

      // Si falla, ejecutar fallback
      this.logger.warn(
        `Canal ${optimalChannel} falló, ejecutando fallback para notificación ${notificationData.id}`
      );

      const fallbackSuccess = await this.fallbackService.executeFailover(
        notificationData.id,
        optimalChannel,
        userPreferences || ['email', 'internal'],
        this.channelServices,
        notificationData
      );

      return {
        success: fallbackSuccess,
        channel: optimalChannel,
        fallbackUsed: true
      };

    } catch (error) {
      this.logger.error(
        `Error enviando notificación ${notificationData.id}:`,
        error.stack
      );

      return {
        success: false,
        channel: 'unknown',
        fallbackUsed: false
      };
    }
  }

  /**
   * 🎯 Selecciona el canal óptimo basado en tipo y preferencias
   * @param notificationType - Tipo de notificación (order, payment, shipping)
   * @param userPreferences - Canales preferidos del usuario
   * @returns string - Canal seleccionado
   */
  private selectOptimalChannel(
    notificationType: string,
    userPreferences: string[]
  ): string {
    // Reglas de negocio para selección de canal
    const channelRules = {
      payment: {
        urgent: ['push', 'sms', 'email'],      // Pagos requieren notificación inmediata
        normal: ['email', 'push', 'internal']
      },
      order: {
        urgent: ['email', 'push', 'internal'],  // Órdenes son importantes pero menos urgentes
        normal: ['email', 'internal']
      },
      shipping: {
        urgent: ['push', 'email', 'internal'],  // Envíos necesitan seguimiento
        normal: ['email', 'internal']
      },
      general: {
        urgent: ['email', 'internal'],          // Generales menos prioritarios
        normal: ['internal', 'email']
      }
    };

    // Determinar urgencia basada en el contexto
    const urgency = this.determineUrgency(notificationType);
    const optimalChannels = channelRules[notificationType]?.[urgency] || 
                           channelRules.general.normal;

    // Encontrar el primer canal óptimo que esté en las preferencias del usuario
    for (const channel of optimalChannels) {
      if (userPreferences.includes(channel) && this.isChannelAvailable(channel)) {
        return channel;
      }
    }

    // Fallback: primer canal disponible de las preferencias
    for (const channel of userPreferences) {
      if (this.isChannelAvailable(channel)) {
        return channel;
      }
    }

    // Último recurso: internal
    return 'internal';
  }

  /**
   * ⚡ Determina la urgencia de una notificación
   * @param notificationType - Tipo de notificación
   * @returns 'urgent' | 'normal'
   */
  private determineUrgency(notificationType: string): 'urgent' | 'normal' {
    // Tipos urgentes que requieren atención inmediata
    const urgentTypes = [
      'payment_failed',
      'payment_dispute',
      'order_cancelled',
      'shipping_delay'
    ];

    return urgentTypes.includes(notificationType) ? 'urgent' : 'normal';
  }

  /**
   * ✅ Verifica si un canal está disponible
   * @param channel - Canal a verificar
   * @returns boolean
   */
  private isChannelAvailable(channel: string): boolean {
    const service = this.channelServices[channel];
    return service !== null && service !== undefined;
  }

  /**
   * 📤 Intenta enviar por un canal específico
   * @param channel - Canal a usar
   * @param notificationData - Datos de la notificación
   * @returns Promise<boolean>
   */
  private async attemptSend(channel: string, notificationData: any): Promise<boolean> {
    try {
      const service = this.channelServices[channel];
      
      if (!service) {
        this.logger.warn(`Servicio no disponible para canal: ${channel}`);
        return false;
      }

      // Usar sendNotification si está disponible, sino usar send
      if (service.sendNotification) {
        return await service.sendNotification({
          ...notificationData,
          channel
        });
      } else if (service.send) {
        return await service.send(
          notificationData.userId,
          notificationData.title || notificationData.subject,
          notificationData.content,
          notificationData.metadata
        );
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error enviando por canal ${channel}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * 🔍 Obtiene canales disponibles
   * @returns string[] - Lista de canales disponibles
   */
  getAvailableChannels(): string[] {
    return Object.keys(this.channelServices).filter(channel => 
      this.isChannelAvailable(channel)
    );
  }

  /**
   * 🧪 Prueba la conectividad de todos los canales
   * @returns Promise<object> - Estado de cada canal
   */
  async testAllChannels(): Promise<Record<string, boolean>> {
    const results = {};

    for (const [channel, service] of Object.entries(this.channelServices)) {
      try {
        if (service && service.testConnection) {
          results[channel] = await service.testConnection();
        } else {
          results[channel] = service !== null;
        }
      } catch (error) {
        this.logger.error(`Error probando canal ${channel}:`, error.message);
        results[channel] = false;
      }
    }

    return results;
  }

  /**
   * 📊 Obtiene estadísticas de uso de canales
   * @param userId - ID del usuario (opcional)
   * @returns Promise<object>
   */
  async getChannelStats(userId?: string): Promise<{
    channelUsage: Record<string, number>;
    fallbackStats: any;
  }> {
    try {
      // Obtener estadísticas de fallback del servicio especializado
      const fallbackStats = await this.fallbackService.getFallbackStats(userId);

      // Simular estadísticas de uso (en producción esto vendría de la BD)
      const channelUsage = {
        email: 150,
        push: 89,
        sms: 34,
        internal: 67
      };

      return {
        channelUsage,
        fallbackStats
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de canales:', error.stack);
      return {
        channelUsage: {},
        fallbackStats: {}
      };
    }
  }
}