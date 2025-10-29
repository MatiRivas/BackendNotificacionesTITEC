import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { OrderConsumer } from './consumers/order.consumer';
import { PaymentConsumer } from './consumers/payment.consumer';
import { ShippingConsumer } from './consumers/shipping.consumer';
import { PaymentIssueConsumer } from './consumers/payment-issue.consumer'; // Nuevo - Sprint 2
import { NotificationsModule } from '../notificaciones/notifications.module';
import kafkaConfig from '../config/kafka.config';

@Module({
  imports: [
    ConfigModule.forFeature(kafkaConfig),
    NotificationsModule,
  ],
  providers: [
    KafkaService,
    OrderConsumer,
    PaymentConsumer,
    ShippingConsumer,
    PaymentIssueConsumer, // Nuevo - Sprint 2
  ],
  exports: [
    KafkaService,
  ],
})
export class KafkaModule {}
