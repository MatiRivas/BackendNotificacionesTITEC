import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: '🚀 TITEC - Microservicio de Notificaciones (Microservices Architecture)',
      version: '2.0.0',
      status: 'Operational',
      timestamp: new Date().toISOString(),
      architecture: 'Microservices - Pure Notifications Service',
      endpoints: {
        notifications: {
          getUserNotifications: 'GET /api/notifications/user/:userId',
          getStats: 'GET /api/notifications/stats',
          retryFailed: 'POST /api/notifications/retry-failed',
          healthCheck: 'GET /api/notifications/health/email',
          testEmail: 'POST /api/notifications/test/email'
        }
      },
      kafka: {
        topics: [
          'orders.created',
          'payments.confirmed',
          'orders.shipped',
          'payments.issues',
          'refunds.processed',
          'orders.status_changed',
          'payments.rejected',
          'disputes.opened'
        ]
      },
      services: {
        kafkaUI: 'http://localhost:8080',
        documentation: 'Consulta el README.md para más información'
      }
    };
  }
}
