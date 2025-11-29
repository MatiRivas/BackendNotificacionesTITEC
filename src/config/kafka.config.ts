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
    // Temas existentes (Sprint 1)
    ordersCreated: process.env.KAFKA_TOPIC_ORDERS_CREATED || 'orders.created',
    ordersStatusChanged: process.env.KAFKA_TOPIC_ORDERS_STATUS || 'orders.status_changed',
    paymentsConfirmed: process.env.KAFKA_TOPIC_PAYMENTS || 'payments.confirmed',
    ordersShipped: process.env.KAFKA_TOPIC_SHIPPING || 'orders.shipped',
    
    // Nuevos temas (Sprint 2) - HDU6, HDU8
    paymentsRejected: process.env.KAFKA_TOPIC_PAYMENTS_REJECTED || 'payments.rejected',
    paymentIssues: process.env.KAFKA_TOPIC_PAYMENT_ISSUES || 'payments.issues',
    refundsProcessed: process.env.KAFKA_TOPIC_REFUNDS || 'refunds.processed',
    disputesOpened: process.env.KAFKA_TOPIC_DISPUTES || 'disputes.opened',
    chargebacksReceived: process.env.KAFKA_TOPIC_CHARGEBACKS || 'chargebacks.received',
    fraudDetected: process.env.KAFKA_TOPIC_FRAUD || 'fraud.detected',
    
    // Nuevos temas (Sprint 4) - HDU2, HDU3, HDU4
    messagesReceived: process.env.KAFKA_TOPIC_MESSAGES_RECEIVED || 'messages.received',
    productsEdited: process.env.KAFKA_TOPIC_PRODUCTS_EDITED || 'products.edited',
  },
}));
