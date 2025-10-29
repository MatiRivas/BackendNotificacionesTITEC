import { Kafka } from 'kafkajs';

// Simular eventos de otros microservicios
async function simulateKafkaEvents() {
  console.log('🎭 Simulando eventos de otros microservicios...\n');

  const kafka = new Kafka({
    clientId: 'event-simulator',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer();

  try {
    await producer.connect();
    console.log('✅ Conectado a Kafka\n');

    // 1. Simular orden creada (HDU1 y HDU3)
    console.log('📦 Simulando orden creada...');
    await producer.send({
      topic: 'orders.created',
      messages: [
        {
          key: 'order-001',
          value: JSON.stringify({
            orderId: 'ORD-' + Date.now(),
            buyerId: 'buyer-123',
            sellerId: 'seller-456',
            totalAmount: 159.99,
            createdAt: new Date().toISOString(),
            products: [
              {
                productId: 'prod-1',
                productName: 'Smartphone',
                quantity: 1,
                price: 159.99
              }
            ],
            buyerEmail: 'comprador@ejemplo.com',
            sellerEmail: 'vendedor@ejemplo.com',
          }),
        },
      ],
    });
    console.log('✅ Evento orden creada enviado');

    // 2. Simular pago confirmado
    console.log('\n💳 Simulando pago confirmado...');
    await producer.send({
      topic: 'payments.confirmed',
      messages: [
        {
          key: 'payment-001',
          value: JSON.stringify({
            paymentId: 'PAY-' + Date.now(),
            orderId: 'ORD-123456',
            buyerId: 'buyer-123',
            sellerId: 'seller-456',
            amount: 159.99,
            paymentMethod: 'credit_card',
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            transactionId: 'TXN-' + Date.now(),
            buyerEmail: 'comprador@ejemplo.com',
            sellerEmail: 'vendedor@ejemplo.com',
          }),
        },
      ],
    });
    console.log('✅ Evento pago confirmado enviado');

    // 3. Simular cambio de estado (HDU2)
    console.log('\n📋 Simulando cambio de estado a "enviado"...');
    await producer.send({
      topic: 'orders.status_changed',
      messages: [
        {
          key: 'status-001',
          value: JSON.stringify({
            orderId: 'ORD-123456',
            buyerId: 'buyer-123',
            sellerId: 'seller-456',
            previousStatus: 'confirmed',
            newStatus: 'shipped',
            updatedAt: new Date().toISOString(),
            buyerEmail: 'comprador@ejemplo.com',
            sellerEmail: 'vendedor@ejemplo.com',
            trackingNumber: 'TRK-' + Date.now(),
          }),
        },
      ],
    });
    console.log('✅ Evento cambio de estado enviado');

    // 4. Simular orden enviada (HDU4)
    console.log('\n🚚 Simulando orden enviada...');
    await producer.send({
      topic: 'orders.shipped',
      messages: [
        {
          key: 'shipping-001',
          value: JSON.stringify({
            orderId: 'ORD-123456',
            buyerId: 'buyer-123',
            sellerId: 'seller-456',
            trackingNumber: 'TRK-' + Date.now(),
            shippingCompany: 'chilexpress',
            shippedAt: new Date().toISOString(),
            estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            shippingAddress: 'Calle Ejemplo 123, Valparaíso, Chile',
            buyerEmail: 'comprador@ejemplo.com',
            sellerEmail: 'vendedor@ejemplo.com',
          }),
        },
      ],
    });
    console.log('✅ Evento orden enviada enviado');

    console.log('\n🎉 Todos los eventos fueron enviados exitosamente!');
    console.log('\n📝 Revisa los logs del microservicio de notificaciones para ver el procesamiento');

  } catch (error) {
    console.error('❌ Error simulando eventos:', error);
  } finally {
    await producer.disconnect();
    console.log('\n👋 Desconectado de Kafka');
  }
}

simulateKafkaEvents();
