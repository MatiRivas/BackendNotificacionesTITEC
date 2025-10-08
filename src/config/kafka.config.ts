import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => ({
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  clientId: process.env.KAFKA_CLIENT_ID || 'notifications-service',
  groupId: process.env.KAFKA_GROUP_ID || 'notifications-group',
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000'),
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '100'),
    retries: parseInt(process.env.KAFKA_RETRIES || '8'),
  },
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD ? {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  } : undefined,
  topics: {
    ordersCreated: process.env.KAFKA_TOPIC_ORDERS_CREATED || 'orders.created',
    ordersStatusChanged: process.env.KAFKA_TOPIC_ORDERS_STATUS || 'orders.status_changed',
    paymentsConfirmed: process.env.KAFKA_TOPIC_PAYMENTS || 'payments.confirmed',
    ordersShipped: process.env.KAFKA_TOPIC_SHIPPING || 'orders.shipped',
  },
}));
