import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { KafkaService } from '../kafka.service';
import { NotificationsService } from '../../notificaciones/notifications.service';
import { MessageReceivedEventDto } from '../dto/message-event.dto';

@Injectable()
export class MessageConsumer implements OnModuleInit {
  private readonly logger = new Logger(MessageConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');
    
    // Suscribirse a eventos de mensajes recibidos
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.messagesReceived,
      this.handleMessageReceived.bind(this),
    );

    this.logger.log('Message Consumer initialized and subscribed to topics');
  }

  private async handleMessageReceived(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing message received event: ${eventData.messageId}`);

      // Validar el DTO
      const messageEvent = plainToClass(MessageReceivedEventDto, eventData);
      const errors = await validate(messageEvent);

      if (errors.length > 0) {
        this.logger.error('Invalid message received event data:', errors);
        return;
      }

      // Determinar el rol del receptor (opuesto al del emisor)
      const receiverRole = messageEvent.senderRole === 'buyer' ? 'seller' : 'buyer';

      // HDU3: Notificar al receptor sobre el nuevo mensaje
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'message_received',
        eventData: messageEvent,
        recipients: [{
          userId: messageEvent.receiverId,
          email: messageEvent.receiverEmail,
          role: receiverRole
        }],
        templateType: 'new_message',
        channels: ['email', 'push'],
        priority: 'medium',
      });

      this.logger.log(`Successfully processed message received event: ${messageEvent.messageId}`);
    } catch (error) {
      this.logger.error('Error processing message received event:', error);
      throw error;
    }
  }
}
