import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, Producer, KafkaMessage } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private readonly consumers: Map<string, Consumer> = new Map();

  constructor(private configService: ConfigService) {
    const kafkaConfig = this.configService.get('kafka');
    
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
      connectionTimeout: kafkaConfig.connectionTimeout,
      requestTimeout: kafkaConfig.requestTimeout,
      retry: kafkaConfig.retry,
      ssl: kafkaConfig.ssl,
      sasl: kafkaConfig.sasl,
      logLevel: 2, // INFO level
    });

    this.consumer = this.kafka.consumer({
      groupId: kafkaConfig.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka Producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka Producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      // Disconnect all consumers
      for (const [topicName, consumer] of this.consumers) {
        await consumer.disconnect();
        this.logger.log(`Consumer for topic ${topicName} disconnected`);
      }

      await this.consumer.disconnect();
      await this.producer.disconnect();
      this.logger.log('Kafka connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing Kafka connections', error);
    }
  }

  async createConsumer(
    topics: string[],
    groupId?: string,
    fromBeginning: boolean = false,
  ): Promise<Consumer> {
    const consumerGroupId = groupId || this.configService.get('kafka.groupId');
    const consumer = this.kafka.consumer({ groupId: consumerGroupId });

    try {
      await consumer.connect();
      await consumer.subscribe({
        topics,
        fromBeginning,
      });

      this.logger.log(`Consumer created for topics: ${topics.join(', ')}`);
      return consumer;
    } catch (error) {
      this.logger.error(`Failed to create consumer for topics: ${topics.join(', ')}`, error);
      throw error;
    }
  }

  async subscribeToTopic(
    topic: string,
    callback: (message: KafkaMessage, topic: string, partition: number) => Promise<void>,
    groupId?: string,
  ) {
    try {
      const consumer = await this.createConsumer([topic], groupId);
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            this.logger.debug(`Processing message from topic: ${topic}, partition: ${partition}`);
            await callback(message, topic, partition);
          } catch (error) {
            this.logger.error(`Error processing message from topic ${topic}:`, error);
            // Aquí podrías implementar dead letter queue o retry logic
            throw error;
          }
        },
      });

      this.consumers.set(topic, consumer);
      this.logger.log(`Successfully subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${topic}`, error);
      throw error;
    }
  }

  async publishMessage(topic: string, message: any, key?: string) {
    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.log(`Message published to topic ${topic}:`, {
        key,
        messageId: result[0].baseOffset,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to publish message to topic ${topic}:`, error);
      throw error;
    }
  }

  async getConsumerHealth(): Promise<{ status: string; topics: string[] }> {
    try {
      const topics = Array.from(this.consumers.keys());
      return {
        status: 'healthy',
        topics,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        topics: [],
      };
    }
  }

  async getProducerHealth(): Promise<{ status: string }> {
    try {
      // Simple health check - try to get metadata
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error('Producer health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}
