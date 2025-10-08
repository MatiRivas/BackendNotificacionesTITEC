import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { KafkaService } from '../kafka.service';
import { NotificationsService } from '../../notificaciones/notifications.service';
import { OrderShippedEventDto, OrderDeliveredEventDto } from '../dto/shipping-event.dto';

@Injectable()
export class ShippingConsumer implements OnModuleInit {
  private readonly logger = new Logger(ShippingConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');
    
    // Suscribirse a eventos de órdenes enviadas
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.ordersShipped,
      this.handleOrderShipped.bind(this),
    );

    this.logger.log('Shipping Consumer initialized and subscribed to topics');
  }

  private async handleOrderShipped(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing order shipped event: ${eventData.orderId} with tracking: ${eventData.trackingNumber}`);

      // Validar el DTO
      const shippingEvent = plainToClass(OrderShippedEventDto, eventData);
      const errors = await validate(shippingEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid order shipped event data:', errors);
        return;
      }

      // HDU4: Notificar al comprador que su pedido fue enviado
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_shipped',
        eventData: shippingEvent,
        recipients: [{
          userId: shippingEvent.buyerId,
          email: shippingEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'order_shipped_buyer',
        channels: ['email', 'push', 'sms'],
        priority: 'high',
      });

      // Notificar al vendedor confirmación de envío
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_shipped',
        eventData: shippingEvent,
        recipients: [{
          userId: shippingEvent.sellerId,
          email: shippingEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'order_shipped_seller',
        channels: ['email', 'push'],
        priority: 'medium',
      });

      this.logger.log(`Successfully processed order shipped event: ${shippingEvent.orderId}`);
    } catch (error) {
      this.logger.error('Error processing order shipped event:', error);
      throw error;
    }
  }

  private async handleOrderDelivered(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing order delivered event: ${eventData.orderId}`);

      // Validar el DTO
      const deliveryEvent = plainToClass(OrderDeliveredEventDto, eventData);
      const errors = await validate(deliveryEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid order delivered event data:', errors);
        return;
      }

      // Notificar al comprador que su pedido fue entregado
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_delivered',
        eventData: deliveryEvent,
        recipients: [{
          userId: deliveryEvent.buyerId,
          email: deliveryEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'order_delivered_buyer',
        channels: ['email', 'push', 'sms'],
        priority: 'high',
      });

      // Notificar al vendedor confirmación de entrega
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_delivered',
        eventData: deliveryEvent,
        recipients: [{
          userId: deliveryEvent.sellerId,
          email: deliveryEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'order_delivered_seller',
        channels: ['email', 'push'],
        priority: 'medium',
      });

      this.logger.log(`Successfully processed order delivered event: ${deliveryEvent.orderId}`);
    } catch (error) {
      this.logger.error('Error processing order delivered event:', error);
      throw error;
    }
  }
}
