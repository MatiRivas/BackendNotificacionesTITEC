/**
 * 📚 SIMULADOR DE BASE DE DATOS DE EVENTOS
 * Script simple para simular cambios en otras BDs y generar eventos
 */

import { MongoClient } from 'mongodb';

// Configuración de la BD de eventos simulada
const EVENTS_DB_CONFIG = {
  uri: 'mongodb+srv://MatiRivas_cluster:matiasrivas1@cluster0.2rxdxu8.mongodb.net/EventsSimulator',
  dbName: 'EventsSimulator',
  collections: {
    orders: 'orders_events',
    payments: 'payments_events', 
    shipping: 'shipping_events'
  }
};

class EventsSimulator {
  private client: MongoClient;
  private db: any;

  constructor() {
    this.client = new MongoClient(EVENTS_DB_CONFIG.uri);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(EVENTS_DB_CONFIG.dbName);
    console.log('✅ Conectado a BD de eventos simulada');
  }

  async disconnect() {
    await this.client.close();
    console.log('🔌 Desconectado de BD de eventos');
  }

  // ============================================
  // 📦 SIMULACIÓN DE ÓRDENES
  // ============================================
  async createOrder(orderData: any) {
    const order = {
      orderId: `ORD-${Date.now()}`,
      status: 'created',
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      totalAmount: orderData.totalAmount,
      products: orderData.products || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insertar en BD simulada
    await this.db.collection(EVENTS_DB_CONFIG.collections.orders).insertOne(order);
    console.log(`📦 Orden creada: ${order.orderId}`);

    // Generar evento para Kafka (simular lo que haría el microservicio real)
    const kafkaEvent = {
      topic: 'orders.created',
      event: {
        orderId: order.orderId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        products: order.products
      }
    };

    console.log('🎯 Evento Kafka generado:', kafkaEvent.topic);
    return { order, kafkaEvent };
  }

  async updateOrderStatus(orderId: string, newStatus: string, extraData: any = {}) {
    const updateData = {
      status: newStatus,
      updatedAt: new Date(),
      ...extraData
    };

    await this.db.collection(EVENTS_DB_CONFIG.collections.orders)
      .updateOne({ orderId }, { $set: updateData });

    console.log(`📋 Orden ${orderId} actualizada a: ${newStatus}`);

    // Generar evento
    const kafkaEvent = {
      topic: 'orders.status_changed',
      event: {
        orderId,
        oldStatus: 'previous_status', // En un caso real, esto vendría de la BD
        newStatus,
        changedAt: new Date().toISOString(),
        ...extraData
      }
    };

    console.log('🎯 Evento Kafka generado:', kafkaEvent.topic);
    return kafkaEvent;
  }

  async cancelOrder(orderId: string, reason: string = 'user_request') {
    const cancelData = {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date()
    };

    const result = await this.db.collection(EVENTS_DB_CONFIG.collections.orders)
      .findOneAndUpdate(
        { orderId },
        { $set: cancelData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      console.log(`❌ Orden no encontrada para cancelar: ${orderId}`);
      return null;
    }

    console.log(`🚫 Orden cancelada: ${orderId} - Razón: ${reason}`);

    // Generar evento
    const kafkaEvent = {
      topic: 'orders.cancelled',
      event: {
        orderId: result.value.orderId,
        buyerId: result.value.buyerId,
        sellerId: result.value.sellerId,
        totalAmount: result.value.totalAmount,
        cancellationReason: reason,
        cancelledAt: cancelData.cancelledAt.toISOString()
      }
    };

    console.log('🎯 Evento Kafka generado:', kafkaEvent.topic);
    return kafkaEvent;
  }

  // ============================================
  // 💳 SIMULACIÓN DE PAGOS
  // ============================================
  async createPayment(paymentData: any) {
    const payment = {
      paymentId: `PAY-${Date.now()}`,
      orderId: paymentData.orderId,
      buyerId: paymentData.buyerId,
      sellerId: paymentData.sellerId,
      amount: paymentData.amount,
      status: 'pending',
      paymentMethod: paymentData.paymentMethod || 'credit_card',
      createdAt: new Date()
    };

    await this.db.collection(EVENTS_DB_CONFIG.collections.payments).insertOne(payment);
    console.log(`💳 Pago creado: ${payment.paymentId}`);

    return payment;
  }

  async confirmPayment(paymentId: string) {
    const payment = await this.db.collection(EVENTS_DB_CONFIG.collections.payments)
      .findOneAndUpdate(
        { paymentId },
        { $set: { status: 'confirmed', confirmedAt: new Date() } },
        { returnDocument: 'after' }
      );

    if (!payment.value) {
      console.log(`❌ Pago no encontrado: ${paymentId}`);
      return null;
    }

    console.log(`✅ Pago confirmado: ${paymentId}`);

    // Generar evento
    const kafkaEvent = {
      topic: 'payments.confirmed',
      event: {
        paymentId: payment.value.paymentId,
        orderId: payment.value.orderId,
        buyerId: payment.value.buyerId,
        sellerId: payment.value.sellerId,
        amount: payment.value.amount,
        paymentMethod: payment.value.paymentMethod,
        confirmedAt: payment.value.confirmedAt.toISOString()
      }
    };

    console.log('🎯 Evento Kafka generado:', kafkaEvent.topic);
    return kafkaEvent;
  }

  async rejectPayment(paymentId: string, reason: string) {
    const payment = await this.db.collection(EVENTS_DB_CONFIG.collections.payments)
      .findOneAndUpdate(
        { paymentId },
        { $set: { status: 'rejected', rejectedAt: new Date(), reason } },
        { returnDocument: 'after' }
      );

    if (!payment.value) {
      console.log(`❌ Pago no encontrado: ${paymentId}`);
      return null;
    }

    console.log(`❌ Pago rechazado: ${paymentId} - ${reason}`);

    // Generar evento
    const kafkaEvent = {
      topic: 'payments.rejected',
      event: {
        paymentId: payment.value.paymentId,
        orderId: payment.value.orderId,
        buyerId: payment.value.buyerId,
        amount: payment.value.amount,
        reason: reason,
        rejectedAt: payment.value.rejectedAt.toISOString(),
        retryAction: this.getRetryAction(reason)
      }
    };

    console.log('🎯 Evento Kafka generado:', kafkaEvent.topic);
    return kafkaEvent;
  }

  private getRetryAction(reason: string): string {
    const actions = {
      'insufficient_funds': 'update_payment_method',
      'card_expired': 'update_card_info',
      'card_declined': 'contact_bank',
      'fraud_detected': 'contact_support'
    };
    return actions[reason] || 'contact_support';
  }

  // ============================================
  // 📊 MÉTODOS DE CONSULTA
  // ============================================
  async getOrdersHistory() {
    return await this.db.collection(EVENTS_DB_CONFIG.collections.orders)
      .find().sort({ createdAt: -1 }).limit(10).toArray();
  }

  async getPaymentsHistory() {
    return await this.db.collection(EVENTS_DB_CONFIG.collections.payments)
      .find().sort({ createdAt: -1 }).limit(10).toArray();
  }

  async getEventsSummary() {
    const [ordersCount, paymentsCount] = await Promise.all([
      this.db.collection(EVENTS_DB_CONFIG.collections.orders).countDocuments(),
      this.db.collection(EVENTS_DB_CONFIG.collections.payments).countDocuments()
    ]);

    return {
      orders: ordersCount,
      payments: paymentsCount,
      total_events: ordersCount + paymentsCount
    };
  }
}

// ============================================
// 🧪 FUNCIONES DE PRUEBA
// ============================================
async function runSimulation() {
  const simulator = new EventsSimulator();
  
  try {
    await simulator.connect();
    
    console.log('🎭 INICIANDO SIMULACIÓN COMPLETA...\n');

    // 1. Crear una orden
    const { order, kafkaEvent: orderEvent } = await simulator.createOrder({
      buyerId: 'buyer-test-123',
      sellerId: 'seller-test-456', 
      totalAmount: 299.99,
      products: [
        { productId: 'LAPTOP-001', name: 'Laptop HP', quantity: 1, price: 299.99 }
      ]
    });

    // 2. Crear pago para la orden
    const payment = await simulator.createPayment({
      orderId: order.orderId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amount: order.totalAmount,
      paymentMethod: 'credit_card'
    });

    // 3. Confirmar el pago (50% probabilidad de confirmar vs rechazar)
    if (Math.random() > 0.5) {
      await simulator.confirmPayment(payment.paymentId);
      await simulator.updateOrderStatus(order.orderId, 'confirmed');
      
      // 4. Posibilidad de cancelación después de confirmación (15% probabilidad)
      if (Math.random() > 0.85) {
        const reasons = ['user_request', 'out_of_stock', 'seller_unavailable'];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        await simulator.cancelOrder(order.orderId, reason);
      }
    } else {
      await simulator.rejectPayment(payment.paymentId, 'insufficient_funds');
    }

    // 4. Mostrar resumen
    console.log('\n📊 RESUMEN DE LA SIMULACIÓN:');
    const summary = await simulator.getEventsSummary();
    console.log(summary);

    console.log('\n📦 ÚLTIMAS ÓRDENES:');
    const orders = await simulator.getOrdersHistory();
    orders.forEach(order => {
      console.log(`- ${order.orderId}: ${order.status} ($${order.totalAmount})`);
    });

    console.log('\n💳 ÚLTIMOS PAGOS:');
    const payments = await simulator.getPaymentsHistory();
    payments.forEach(payment => {
      console.log(`- ${payment.paymentId}: ${payment.status} ($${payment.amount})`);
    });

  } catch (error) {
    console.error('❌ Error en simulación:', error);
  } finally {
    await simulator.disconnect();
  }
}

// ============================================
// 🚀 SCRIPT PRINCIPAL
// ============================================
async function main() {
  console.log('📚 SIMULADOR DE EVENTOS DE MICROSERVICIOS');
  console.log('==========================================\n');
  
  console.log('🎯 Este script simula:');
  console.log('✅ Creación de órdenes en microservicio Orders');
  console.log('✅ Confirmación/rechazo de pagos en microservicio Payments');
  console.log('✅ Cambios de estado de órdenes');
  console.log('✅ Generación de eventos Kafka correspondientes\n');

  await runSimulation();

  console.log('\n🔍 PARA VERIFICAR FUNCIONAMIENTO:');
  console.log('1. Este script crea eventos en BD simulada');
  console.log('2. Los eventos Kafka se muestran en consola');
  console.log('3. Tu microservicio de notificaciones debe escuchar estos eventos');
  console.log('4. Verificar que se crean notificaciones en tu BD');
}

if (require.main === module) {
  main();
}

export { EventsSimulator, runSimulation };