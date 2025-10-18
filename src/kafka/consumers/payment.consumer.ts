import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { KafkaService } from '../kafka.service';
import { NotificationsService } from '../../notificaciones/notifications.service';
import { PaymentConfirmedEventDto, PaymentFailedEventDto, PaymentRejectedEventDto } from '../dto/payment-event.dto';

@Injectable()
export class PaymentConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');
    
    // Suscribirse a eventos de pagos confirmados
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.paymentsConfirmed,
      this.handlePaymentConfirmed.bind(this),
    );

    // Suscribirse a eventos de pagos rechazados - HDU6
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.paymentsRejected,
      this.handlePaymentRejected.bind(this),
    );

    this.logger.log('Payment Consumer initialized and subscribed to topics');
  }

  private async handlePaymentConfirmed(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing payment confirmed event: ${eventData.paymentId} for order: ${eventData.orderId}`);

      // Validar el DTO
      const paymentEvent = plainToClass(PaymentConfirmedEventDto, eventData);
      const errors = await validate(paymentEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid payment confirmed event data:', errors);
        return;
      }

      // Notificar al vendedor que el pago fue confirmado
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'payment_confirmed',
        eventData: paymentEvent,
        recipients: [{
          userId: paymentEvent.sellerId,
          email: paymentEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'payment_confirmed_seller',
        channels: ['email', 'push'],
        priority: 'high',
      });

      // Notificar al comprador que el pago fue procesado exitosamente
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'payment_confirmed',
        eventData: paymentEvent,
        recipients: [{
          userId: paymentEvent.buyerId,
          email: paymentEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'payment_confirmed_buyer',
        channels: ['email', 'push'],
        priority: 'high',
      });

      this.logger.log(`Successfully processed payment confirmed event: ${paymentEvent.paymentId}`);
    } catch (error) {
      this.logger.error('Error processing payment confirmed event:', error);
      throw error;
    }
  }

  private async handlePaymentFailed(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing payment failed event: ${eventData.paymentId} for order: ${eventData.orderId}`);

      // Validar el DTO
      const paymentEvent = plainToClass(PaymentFailedEventDto, eventData);
      const errors = await validate(paymentEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid payment failed event data:', errors);
        return;
      }

      // Notificar al comprador que el pago falló
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'payment_failed',
        eventData: paymentEvent,
        recipients: [{
          userId: paymentEvent.buyerId,
          email: paymentEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'payment_failed_buyer',
        channels: ['email', 'push'],
        priority: 'high',
      });

      // Notificar al vendedor (opcional, dependiendo del negocio)
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'payment_failed',
        eventData: paymentEvent,
        recipients: [{
          userId: paymentEvent.sellerId,
          email: paymentEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'payment_failed_seller',
        channels: ['email'],
        priority: 'medium',
      });

      this.logger.log(`Successfully processed payment failed event: ${paymentEvent.paymentId}`);
    } catch (error) {
      this.logger.error('Error processing payment failed event:', error);
      throw error;
    }
  }

  /**
   * 🚫 Maneja eventos de pago rechazado - HDU6
   * Notifica al comprador cuando su pago es rechazado con opciones de reintento
   */
  private async handlePaymentRejected(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(
        `Processing payment rejected event: ${eventData.paymentId} for order: ${eventData.orderId}, ` +
        `reason: ${eventData.rejectionReason}`
      );

      // Validar el DTO
      const paymentEvent = plainToClass(PaymentRejectedEventDto, eventData);
      const errors = await validate(paymentEvent);

      if (errors.length > 0) {
        this.logger.error('Payment rejected event validation failed:', errors);
        throw new Error(`Invalid payment rejected event data: ${errors.map(e => e.toString()).join(', ')}`);
      }

      // HDU6: Notificar al comprador sobre el pago rechazado
      // "Máximo 5 segundos de latencia" - usar canal rápido con fallback
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'payment_rejected',
        eventData: {
          ...paymentEvent,
          // Incluir datos adicionales para el template
          rejectionReason: paymentEvent.rejectionReason,
          rejectionCode: paymentEvent.rejectionCode,
          retryAllowed: paymentEvent.retryAllowed || 'yes',
          retryUrl: `/orders/${paymentEvent.orderId}/payment`,
          supportUrl: '/support/payment-issues'
        },
        recipients: [{
          userId: paymentEvent.buyerId,
          email: paymentEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'payment_rejected_buyer',
        channels: ['email', 'internal'], // Email primero, internal como fallback
        priority: 'high', // Prioridad alta para cumplir latencia de 5 segundos
      });

      this.logger.log(
        `Successfully processed payment rejected event: ${paymentEvent.paymentId}, ` +
        `notified buyer: ${paymentEvent.buyerId}`
      );
    } catch (error) {
      this.logger.error('Error processing payment rejected event:', error);
      throw error;
    }
  }
}
