/**
 * 📡 ALTERNATIVA 1: POLLING DE APIs
 * Los otros servicios NO publican eventos, tu microservicio los consulta periódicamente
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
class ApiPollingServiceExample {
  private readonly logger = new Logger(ApiPollingServiceExample.name);
  private lastOrderCheck: Date = new Date();
  private lastPaymentCheck: Date = new Date();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 🔄 Consultar nuevas órdenes cada 30 segundos
   */
  async checkNewOrders() {
    try {
      const ordersServiceUrl = this.configService.get('ORDERS_SERVICE_URL');
      
      // Consultar órdenes creadas desde la última verificación
      const response = await firstValueFrom(
        this.httpService.get(`${ordersServiceUrl}/api/orders/since`, {
          params: {
            since: this.lastOrderCheck.toISOString(),
            limit: 50
          }
        })
      );

      const newOrders = response.data;
      this.logger.log(`📦 Encontradas ${newOrders.length} nuevas órdenes`);

      for (const order of newOrders) {
        await this.processNewOrder(order);
      }

      this.lastOrderCheck = new Date();
    } catch (error) {
      this.logger.error('❌ Error consultando nuevas órdenes:', error.message);
    }
  }

  /**
   * 💳 Consultar cambios en pagos cada 15 segundos
   */
  async checkPaymentUpdates() {
    try {
      const paymentsServiceUrl = this.configService.get('PAYMENTS_SERVICE_URL');
      
      const response = await firstValueFrom(
        this.httpService.get(`${paymentsServiceUrl}/api/payments/updates`, {
          params: {
            since: this.lastPaymentCheck.toISOString()
          }
        })
      );

      const paymentUpdates = response.data;
      this.logger.log(`💳 Encontradas ${paymentUpdates.length} actualizaciones de pago`);

      for (const payment of paymentUpdates) {
        await this.processPaymentUpdate(payment);
      }

      this.lastPaymentCheck = new Date();
    } catch (error) {
      this.logger.error('❌ Error consultando pagos:', error.message);
    }
  }

  private async processNewOrder(order: any) {
    // Crear notificaciones para nueva orden
    console.log('Procesando nueva orden:', order.orderId);
  }

  private async processPaymentUpdate(payment: any) {
    if (payment.status === 'confirmed') {
      console.log('Pago confirmado:', payment.paymentId);
    } else if (payment.status === 'rejected') {
      console.log('Pago rechazado:', payment.paymentId);
    }
  }
}

// ============================================
// 📊 VENTAJAS Y DESVENTAJAS DEL POLLING
// ============================================

const POLLING_PROS_CONS = {
  ventajas: [
    "✅ No requiere cambios en otros microservicios",
    "✅ Control total sobre cuándo y qué consultar", 
    "✅ Más simple de implementar",
    "✅ No necesita infraestructura de Kafka",
    "✅ Fácil debugging y monitoreo"
  ],
  desventajas: [
    "❌ Mayor latencia (retraso de hasta 30 segundos)",
    "❌ Más carga en las APIs de otros servicios",
    "❌ Puede perder eventos si hay muchos cambios",
    "❌ Requiere endpoints específicos en otros servicios"
  ],
  cuando_usar: [
    "🎯 Cuando otros equipos no pueden implementar Kafka",
    "🎯 Para prototipos y MVPs rápidos",
    "🎯 Cuando la latencia no es crítica",
    "🎯 Proyectos pequeños/medianos"
  ]
};

export { ApiPollingServiceExample, POLLING_PROS_CONS };