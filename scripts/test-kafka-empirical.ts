/**
 * 🧪 SCRIPT DE PRUEBA EMPÍRICA PARA KAFKA
 * Simula eventos de otros microservicios para probar las notificaciones
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KafkaService } from '../src/kafka/kafka.service';

async function testKafkaEvents() {
  console.log('🚀 Iniciando pruebas empíricas de Kafka...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const kafkaService = app.get(KafkaService);

  // ============================================
  // 📦 TEST 1: SIMULACIÓN DE ORDEN CREADA
  // ============================================
  console.log('📦 TEST 1: Simulando creación de orden...');
  
  const orderCreatedEvent = {
    orderId: 'ORD-TEST-001',
    buyerId: 'buyer-uuid-123',
    sellerId: 'seller-uuid-456', 
    totalAmount: 250.75,
    createdAt: new Date().toISOString(),
    products: [
      {
        productId: 'PROD-001',
        productName: 'Laptop Gaming',
        quantity: 1,
        price: 250.75
      }
    ]
  };

  try {
    await kafkaService.publishMessage('orders.created', orderCreatedEvent);
    console.log('✅ Evento de orden creada enviado');
    console.log('   🔍 Verificar en logs si se creó notificación para comprador y vendedor\n');
  } catch (error) {
    console.error('❌ Error enviando evento de orden:', error);
  }

  // Esperar un poco para procesar
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================
  // 💳 TEST 2: SIMULACIÓN DE PAGO CONFIRMADO  
  // ============================================
  console.log('💳 TEST 2: Simulando confirmación de pago...');
  
  const paymentConfirmedEvent = {
    paymentId: 'PAY-TEST-001',
    orderId: 'ORD-TEST-001',
    buyerId: 'buyer-uuid-123',
    sellerId: 'seller-uuid-456',
    amount: 250.75,
    paymentMethod: 'credit_card',
    confirmedAt: new Date().toISOString()
  };

  try {
    await kafkaService.publishMessage('payments.confirmed', paymentConfirmedEvent);
    console.log('✅ Evento de pago confirmado enviado');
    console.log('   🔍 Verificar notificación al vendedor sobre pago recibido\n');
  } catch (error) {
    console.error('❌ Error enviando evento de pago:', error);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================
  // ❌ TEST 3: SIMULACIÓN DE PAGO RECHAZADO
  // ============================================
  console.log('❌ TEST 3: Simulando pago rechazado...');
  
  const paymentRejectedEvent = {
    paymentId: 'PAY-TEST-002',
    orderId: 'ORD-TEST-002', 
    buyerId: 'buyer-uuid-789',
    amount: 89.99,
    reason: 'insufficient_funds',
    rejectedAt: new Date().toISOString(),
    retryAction: 'update_payment_method'
  };

  try {
    await kafkaService.publishMessage('payments.rejected', paymentRejectedEvent);
    console.log('✅ Evento de pago rechazado enviado');
    console.log('   🔍 Verificar notificación al comprador con metadata de problema\n');
  } catch (error) {
    console.error('❌ Error enviando evento de pago rechazado:', error);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================
  // 📋 TEST 4: CAMBIO DE ESTADO DE ORDEN
  // ============================================
  console.log('📋 TEST 4: Simulando cambio de estado...');
  
  const orderStatusEvent = {
    orderId: 'ORD-TEST-001',
    buyerId: 'buyer-uuid-123',
    sellerId: 'seller-uuid-456',
    oldStatus: 'confirmed',
    newStatus: 'shipped',
    changedAt: new Date().toISOString(),
    trackingNumber: 'TRACK-ABC123'
  };

  try {
    await kafkaService.publishMessage('orders.status_changed', orderStatusEvent);
    console.log('✅ Evento de cambio de estado enviado');
    console.log('   🔍 Verificar notificaciones sobre envío\n');
  } catch (error) {
    console.error('❌ Error enviando evento de estado:', error);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================
  // 🚚 TEST 5: ACTUALIZACIÓN DE ENVÍO
  // ============================================
  console.log('🚚 TEST 5: Simulando actualización de envío...');
  
  const shippingEvent = {
    orderId: 'ORD-TEST-001',
    buyerId: 'buyer-uuid-123',
    trackingNumber: 'TRACK-ABC123',
    status: 'in_transit',
    location: 'Centro de distribución Santiago',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await kafkaService.publishMessage('shipping.updated', shippingEvent);
    console.log('✅ Evento de envío enviado');
    console.log('   🔍 Verificar notificación sobre estado del envío\n');
  } catch (error) {
    console.error('❌ Error enviando evento de envío:', error);
  }

  // ============================================
  // 📊 RESUMEN DE PRUEBAS
  // ============================================
  console.log('📊 RESUMEN DE PRUEBAS COMPLETADAS:');
  console.log('✅ 5 eventos de Kafka simulados');
  console.log('🔍 Para verificar funcionamiento:');
  console.log('   1. Revisar logs del microservicio');
  console.log('   2. Consultar BD: db.notificaciones.find()');
  console.log('   3. Probar endpoints: GET /api/notifications/stats');
  console.log('   4. Verificar emails enviados (si configurado)');
  
  await app.close();
}

// ============================================
// 🔧 FUNCIÓN PARA CREAR BD DE PRUEBA SIMPLE
// ============================================
async function createSimpleTestDatabase() {
  console.log('📚 Creando base de datos de prueba simple...\n');
  
  const testEvents = [
    {
      timestamp: new Date(),
      microservice: 'orders-service',
      event_type: 'order_created',
      data: {
        orderId: 'ORD-001',
        buyerId: 'buyer-123',
        sellerId: 'seller-456',
        amount: 199.99
      }
    },
    {
      timestamp: new Date(),
      microservice: 'payments-service', 
      event_type: 'payment_confirmed',
      data: {
        paymentId: 'PAY-001',
        orderId: 'ORD-001',
        amount: 199.99
      }
    },
    {
      timestamp: new Date(),
      microservice: 'payments-service',
      event_type: 'payment_rejected', 
      data: {
        paymentId: 'PAY-002',
        orderId: 'ORD-002',
        reason: 'insufficient_funds'
      }
    }
  ];

  console.log('💾 Eventos de prueba que se pueden almacenar:');
  testEvents.forEach((event, index) => {
    console.log(`${index + 1}. ${event.event_type} desde ${event.microservice}`);
  });
  
  return testEvents;
}

// ============================================
// 🎯 SCRIPT PRINCIPAL
// ============================================
async function main() {
  console.log('🧪 KAFKA EMPIRICAL TESTING SUITE');
  console.log('=================================\n');
  
  try {
    // Opción 1: Probar eventos de Kafka
    await testKafkaEvents();
    
    // Opción 2: Mostrar estructura de BD de prueba
    console.log('\n📚 ESTRUCTURA SUGERIDA PARA BD DE PRUEBA:');
    const testData = await createSimpleTestDatabase();
    console.log(JSON.stringify(testData, null, 2));
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export { testKafkaEvents, createSimpleTestDatabase };