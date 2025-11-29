import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { KafkaService } from '../kafka.service';
import { NotificationsService } from '../../notificaciones/notifications.service';
import { 
  OrderCreatedEventDto, 
  OrderStatusChangedEventDto, 
  OrderCancelledEventDto 
} from '../dto/order-event.dto';

@Injectable()
export class OrderConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');
    
    // Suscribirse a eventos de órdenes creadas
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.ordersCreated,
      this.handleOrderCreated.bind(this),
    );

    // Suscribirse a cambios de estado de órdenes
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.ordersStatusChanged,
      this.handleOrderStatusChanged.bind(this),
    );

    this.logger.log('Order Consumer initialized and subscribed to topics');
  }

  private async handleOrderCreated(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing order created event: ${eventData.orderId}`);

      // Validar el DTO
      const orderEvent = plainToClass(OrderCreatedEventDto, eventData);
      const errors = await validate(orderEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid order created event data:', errors);
        return;
      }

      // HDU1: Notificar al vendedor sobre nueva compra
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_created',
        eventData: orderEvent,
        recipients: [{
          userId: orderEvent.sellerId,
          email: orderEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'new_order_seller',
        channels: ['email', 'push'],
        priority: 'high',
      });

      // HDU3: Notificar al comprador confirmación de compra
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_created',
        eventData: orderEvent,
        recipients: [{
          userId: orderEvent.buyerId,
          email: orderEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'order_confirmation_buyer',
        channels: ['email', 'push'],
        priority: 'high',
      });

      this.logger.log(`Successfully processed order created event: ${orderEvent.orderId}`);
    } catch (error) {
      this.logger.error('Error processing order created event:', error);
      throw error;
    }
  }

  private async handleOrderStatusChanged(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing order status changed event: ${eventData.orderId} -> ${eventData.newStatus}`);

      // Validar el DTO
      const statusEvent = plainToClass(OrderStatusChangedEventDto, eventData);
      const errors = await validate(statusEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid order status changed event data:', errors);
        return;
      }

      // HDU2: Notificar al vendedor sobre cambio de estado
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'order_status_changed',
        eventData: statusEvent,
        recipients: [{
          userId: statusEvent.sellerId,
          email: statusEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'order_status_seller',
        channels: ['email', 'push'],
        priority: this.getNotificationPriority(statusEvent.newStatus),
      });

      // HDU4: Notificar al comprador sobre envío (si el estado es 'shipped')
      if (statusEvent.newStatus === 'shipped') {
        await this.notificationsService.createNotificationFromEvent({
          eventType: 'order_shipped',
          eventData: statusEvent,
          recipients: [{
            userId: statusEvent.buyerId,
            email: statusEvent.buyerEmail,
            role: 'buyer'
          }],
          templateType: 'order_shipped_buyer',
          channels: ['email', 'push'],
          priority: 'high',
        });
      }

      // Notificar al comprador otros cambios de estado relevantes
      if (['confirmed', 'preparing', 'delivered'].includes(statusEvent.newStatus)) {
        await this.notificationsService.createNotificationFromEvent({
          eventType: 'order_status_changed',
          eventData: statusEvent,
          recipients: [{
            userId: statusEvent.buyerId,
            email: statusEvent.buyerEmail,
            role: 'buyer'
          }],
          templateType: 'order_status_buyer',
          channels: ['email', 'push'],
          priority: this.getNotificationPriority(statusEvent.newStatus),
        });
      }

      // HDU2 (Sprint 4): Notificar al vendedor si el pedido está listo para despacho
      if (statusEvent.newStatus === 'Listo para despacho' || 
          statusEvent.newStatus === 'listo_para_despacho' ||
          statusEvent.newStatus === 'ready_to_ship') {
        
        await this.notificationsService.createNotificationFromEvent({
          eventType: 'order_ready_to_ship',
          eventData: statusEvent,
          recipients: [{
            userId: statusEvent.sellerId,
            email: statusEvent.sellerEmail,
            role: 'seller'
          }],
          templateType: 'order_ready_to_ship',
          channels: ['email', 'push'],
          priority: 'high',
        });

        this.logger.log(`Order ready to ship notification sent for order: ${statusEvent.orderId}`);
      }

      // Manejar cancelaciones
      if (statusEvent.newStatus === 'cancelled') {
        await this.handleOrderCancellation(statusEvent);
      }

      this.logger.log(`Successfully processed order status changed event: ${statusEvent.orderId}`);
    } catch (error) {
      this.logger.error('Error processing order status changed event:', error);
      throw error;
    }
  }

  private async handleOrderCancellation(statusEvent: OrderStatusChangedEventDto) {
    // Notificar cancelación al vendedor
    await this.notificationsService.createNotificationFromEvent({
      eventType: 'order_cancelled',
      eventData: statusEvent,
      recipients: [{
        userId: statusEvent.sellerId,
        email: statusEvent.sellerEmail,
        role: 'seller'
      }],
      templateType: 'order_cancelled_seller',
      channels: ['email', 'push'],
      priority: 'high',
    });

    // Notificar cancelación al comprador
    await this.notificationsService.createNotificationFromEvent({
      eventType: 'order_cancelled',
      eventData: statusEvent,
      recipients: [{
        userId: statusEvent.buyerId,
        email: statusEvent.buyerEmail,
        role: 'buyer'
      }],
      templateType: 'order_cancelled_buyer',
      channels: ['email', 'push'],
      priority: 'high',
    });
  }

  private getNotificationPriority(status: string): 'low' | 'medium' | 'high' {
    switch (status) {
      case 'confirmed':
      case 'shipped':
      case 'delivered':
      case 'cancelled':
        return 'high';
      case 'preparing':
        return 'medium';
      default:
        return 'low';
    }
  }
}
