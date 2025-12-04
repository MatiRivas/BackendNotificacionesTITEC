import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { KafkaService } from '../kafka.service';
import { NotificationsService } from '../../notificaciones/notifications.service';
import { ProductEditedEventDto } from '../dto/product-event.dto';

@Injectable()
export class ProductConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProductConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');
    
    // Suscribirse a eventos de productos editados
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.productsEdited,
      this.handleProductEdited.bind(this),
    );

    this.logger.log('Product Consumer initialized and subscribed to topics');
  }

  private async handleProductEdited(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing product edited event: ${eventData.productId}`);

      // Validar el DTO
      const productEvent = plainToClass(ProductEditedEventDto, eventData);
      const errors = await validate(productEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid product edited event data:', errors);
        return;
      }

      // HDU4: Notificar al vendedor sobre la edición exitosa del producto
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'product_edited',
        eventData: productEvent,
        recipients: [{
          userId: productEvent.sellerId,
          email: productEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'product_edited_confirmation',
        channels: ['email', 'push'],
        priority: 'low',
      });

      this.logger.log(`Successfully processed product edited event: ${productEvent.productId}`);
    } catch (error) {
      this.logger.error('Error processing product edited event:', error);
      throw error;
    }
  }
}
