import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: '🚀 TITEC - Microservicio de Notificaciones',
      version: '1.0.0',
      status: 'Operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          profile: 'GET /api/auth/me'
        },
        users: {
          list: 'GET /api/users',
          create: 'POST /api/users',
          get: 'GET /api/users/:id',
          update: 'PATCH /api/users/:id',
          delete: 'DELETE /api/users/:id'
        },
        notifications: {
          getUserNotifications: 'GET /api/notifications/user/:userId',
          getStats: 'GET /api/notifications/stats',
          retryFailed: 'POST /api/notifications/retry-failed',
          healthCheck: 'GET /api/notifications/health/email',
          testEmail: 'POST /api/notifications/test/email',
          preferences: 'GET /api/notifications/user/:userId/preferences',
          updatePreferences: 'PUT /api/notifications/user/:userId/preferences'
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
