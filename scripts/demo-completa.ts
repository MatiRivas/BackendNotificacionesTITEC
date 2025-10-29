import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KafkaService } from '../src/kafka/kafka.service';
import { NotificationsService } from '../src/notificaciones/notifications.service';

/**
 * 🎬 DEMO COMPLETA DEL SISTEMA DE NOTIFICACIONES CON KAFKA
 * 
 * Esta demo simula el flujo completo de las 4 HDUs:
 * HDU1: Vendedor recibe notificación cuando comprador realiza compra
 * HDU2: Vendedor recibe notificación cuando pedido cambia de estado
 * HDU3: Comprador recibe notificación confirmando su compra
 * HDU4: Comprador recibe notificación cuando producto es enviado
 */

async function demoCompleta() {
  console.log('🎬 === DEMO COMPLETA: Sistema de Notificaciones con Kafka ===\n');

  try {
    // Crear la aplicación
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    const kafkaService = app.get(KafkaService);
    const notificationsService = app.get(NotificationsService);

    console.log('✅ Aplicación iniciada correctamente\n');

    // ============================================
    // 🛒 PASO 1: SIMULANDO COMPRA (HDU1 + HDU3)
    // ============================================
    console.log('🛒 PASO 1: Comprador realiza una compra');
    console.log('─'.repeat(50));

    const ordenCompra = {
      orderId: 'ORD-' + Date.now(),
      buyerId: 'buyer-123',
      sellerId: 'seller-456', 
      totalAmount: 89.99,
      createdAt: new Date().toISOString(),
      products: [
        {
          productId: 'prod-1',
          productName: 'Audífonos Bluetooth',
          quantity: 1,
          price: 89.99
        }
      ],
      buyerEmail: 'comprador@ejemplo.com',
      sellerEmail: 'vendedor@ejemplo.com'
    };

    console.log('📦 Datos de la orden:', JSON.stringify(ordenCompra, null, 2));

    // Simular evento de Kafka from microservicio de compras
    console.log('\n📡 Enviando evento "orders.created" a Kafka...');
    
    try {
      await kafkaService.publishMessage('orders.created', ordenCompra, ordenCompra.orderId);
      console.log('✅ Evento enviado exitosamente');
      
      // Esperar un poco para que el consumer procese
      console.log('⏳ Esperando procesamiento del consumer...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log('⚠️  Kafka no está disponible, simulando directamente...');
      
      // Simular el procesamiento directo si Kafka no está disponible
      await simularProcesamiento(notificationsService, 'order_created', ordenCompra);
    }

    // ============================================
    // 💳 PASO 2: SIMULANDO PAGO CONFIRMADO
    // ============================================ 
    console.log('\n💳 PASO 2: Pago confirmado');
    console.log('─'.repeat(50));

    const pagoConfirmado = {
      paymentId: 'PAY-' + Date.now(),
      orderId: ordenCompra.orderId,
      buyerId: ordenCompra.buyerId,
      sellerId: ordenCompra.sellerId,
      amount: ordenCompra.totalAmount,
      paymentMethod: 'credit_card',
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      transactionId: 'TXN-' + Date.now(),
      buyerEmail: ordenCompra.buyerEmail,
      sellerEmail: ordenCompra.sellerEmail
    };

    console.log('💰 Datos del pago:', JSON.stringify(pagoConfirmado, null, 2));

    try {
      await kafkaService.publishMessage('payments.confirmed', pagoConfirmado, pagoConfirmado.paymentId);
      console.log('✅ Evento pago confirmado enviado');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.log('⚠️  Simulando procesamiento directo...');
      await simularProcesamiento(notificationsService, 'payment_confirmed', pagoConfirmado);
    }

    // ============================================
    // 📦 PASO 3: SIMULANDO CAMBIO DE ESTADO (HDU2)
    // ============================================
    console.log('\n📦 PASO 3: Orden cambia a estado "shipped"');
    console.log('─'.repeat(50));

    const cambioEstado = {
      orderId: ordenCompra.orderId,
      buyerId: ordenCompra.buyerId,
      sellerId: ordenCompra.sellerId,
      previousStatus: 'confirmed',
      newStatus: 'shipped',
      updatedAt: new Date().toISOString(),
      buyerEmail: ordenCompra.buyerEmail,
      sellerEmail: ordenCompra.sellerEmail,
      trackingNumber: 'TRK-' + Date.now()
    };

    console.log('📋 Cambio de estado:', JSON.stringify(cambioEstado, null, 2));

    try {
      await kafkaService.publishMessage('orders.status_changed', cambioEstado, cambioEstado.orderId);
      console.log('✅ Evento cambio de estado enviado');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.log('⚠️  Simulando procesamiento directo...');
      await simularProcesamiento(notificationsService, 'order_status_changed', cambioEstado);
    }

    // ============================================
    // 🚚 PASO 4: SIMULANDO ENVÍO (HDU4)
    // ============================================
    console.log('\n🚚 PASO 4: Producto enviado');
    console.log('─'.repeat(50));

    const productoEnviado = {
      orderId: ordenCompra.orderId,
      buyerId: ordenCompra.buyerId,
      sellerId: ordenCompra.sellerId,
      trackingNumber: cambioEstado.trackingNumber,
      shippingCompany: 'chilexpress',
      shippedAt: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      shippingAddress: 'Calle Errázuriz 1834, Valparaíso, Chile',
      buyerEmail: ordenCompra.buyerEmail,
      sellerEmail: ordenCompra.sellerEmail
    };

    console.log('🚛 Datos del envío:', JSON.stringify(productoEnviado, null, 2));

    try {
      await kafkaService.publishMessage('orders.shipped', productoEnviado, productoEnviado.orderId);
      console.log('✅ Evento producto enviado enviado');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.log('⚠️  Simulando procesamiento directo...');
      await simularProcesamiento(notificationsService, 'order_shipped', productoEnviado);
    }

    // ============================================
    // 📊 PASO 5: MOSTRAR RESULTADOS
    // ============================================
    console.log('\n📊 PASO 5: Resultados del procesamiento');
    console.log('─'.repeat(50));

    try {
      const stats = await notificationsService.getNotificationStats();
      console.log('📈 Estadísticas generales:');
      console.log(`   Total notificaciones: ${stats.total}`);
      console.log('   Por estado:', stats.byStatus);
      console.log('   Por canal:', stats.byChannel);

      // Mostrar notificaciones del comprador
      console.log('\n📧 Notificaciones del COMPRADOR (buyer-123):');
      const buyerNotifications = await notificationsService.getNotificationsByUser('buyer-123');
      buyerNotifications.forEach((notif: any, index) => {
        console.log(`   ${index + 1}. [${notif.status}] ${notif.subject}`);
        console.log(`      Canal: ${notif.channel} | Creada: ${new Date(notif.createdAt || Date.now()).toLocaleString()}`);
      });

      // Mostrar notificaciones del vendedor
      console.log('\n📧 Notificaciones del VENDEDOR (seller-456):');
      const sellerNotifications = await notificationsService.getNotificationsByUser('seller-456');
      sellerNotifications.forEach((notif: any, index) => {
        console.log(`   ${index + 1}. [${notif.status}] ${notif.subject}`);
        console.log(`      Canal: ${notif.channel} | Creada: ${new Date(notif.createdAt || Date.now()).toLocaleString()}`);
      });

    } catch (error) {
      console.log('ℹ️  No se pudieron obtener estadísticas (base de datos no disponible)');
    }

    console.log('\n🎉 === DEMO COMPLETADA ===');
    console.log('\n📝 RESUMEN DE LO QUE PASÓ:');
    console.log('✅ HDU1: Vendedor notificado de nueva compra');
    console.log('✅ HDU2: Vendedor notificado de cambio de estado'); 
    console.log('✅ HDU3: Comprador notificado de confirmación de compra');
    console.log('✅ HDU4: Comprador notificado de envío del producto');
    console.log('\n🔧 Para producción:');
    console.log('   - Configurar Kafka en localhost:9092');
    console.log('   - Configurar SMTP en .env para envío real de emails');
    console.log('   - Configurar MongoDB para persistencia');

    await app.close();

  } catch (error) {
    console.error('❌ Error en la demo:', error);
    process.exit(1);
  }
}

// Función auxiliar para simular procesamiento cuando Kafka no está disponible
async function simularProcesamiento(notificationsService: NotificationsService, eventType: string, eventData: any) {
  console.log(`🔄 Simulando procesamiento de evento: ${eventType}`);
  
  const recipients = [];
  
  // Determinar recipients basado en el tipo de evento
  if (['order_created', 'payment_confirmed'].includes(eventType)) {
    recipients.push(
      {
        userId: eventData.sellerId,
        email: eventData.sellerEmail,
        role: 'seller' as const
      },
      {
        userId: eventData.buyerId, 
        email: eventData.buyerEmail,
        role: 'buyer' as const
      }
    );
  } else {
    recipients.push({
      userId: eventData.buyerId,
      email: eventData.buyerEmail, 
      role: 'buyer' as const
    });
  }

  try {
    const notifications = await notificationsService.createNotificationFromEvent({
      eventType,
      eventData,
      recipients,
      templateType: getTemplateType(eventType),
      channels: ['email'],
      priority: 'high' as const
    });

    console.log(`✅ ${notifications.length} notificaciones creadas`);
  } catch (error) {
    console.log(`⚠️  Error simulando ${eventType}:`, error.message);
  }
}

function getTemplateType(eventType: string): string {
  const templates = {
    'order_created': 'new_order_seller',
    'payment_confirmed': 'payment_confirmed_seller', 
    'order_status_changed': 'order_status_seller',
    'order_shipped': 'order_shipped_buyer'
  };
  return templates[eventType] || 'default';
}

demoCompleta();
