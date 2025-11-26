/**
 * 🧪 SCRIPT DE PRUEBA PARA TODAS LAS PLANTILLAS DE NOTIFICACIONES
 * 
 * Este script prueba las 14 plantillas de notificaciones enviando eventos simulados
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/notifications';

// IDs de usuarios de prueba
const TEST_USERS = {
  buyer: 'buyer-test-123',
  seller: 'seller-test-456'
};

interface TestNotification {
  plantillaId: number;
  name: string;
  eventData: any;
  recipients: Array<{ userId: string; role: string; email?: string }>;
}

// Definición de todas las pruebas
const NOTIFICATION_TESTS: TestNotification[] = [
  // ====== PLANTILLA 1: Nueva venta (Vendedor) ======
  {
    plantillaId: 1,
    name: 'Nueva venta realizada (Vendedor)',
    eventData: {
      orderId: 'ORD-1001',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 45990,
      buyerName: 'Juan Pérez',
      sellerName: 'Tienda Tech',
      vendorName: 'Tienda Tech',
      products: [{
        productId: 'PROD-001',
        productName: 'Laptop Dell Inspiron 15',
        quantity: 1,
        price: 45990
      }],
      buyerEmail: 'juan.perez@example.com',
      sellerEmail: 'tienda@tech.com',
      createdAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller', email: 'tienda@tech.com' }]
  },

  // ====== PLANTILLA 2: Compra confirmada (Comprador) ======
  {
    plantillaId: 2,
    name: 'Compra confirmada (Comprador)',
    eventData: {
      orderId: 'ORD-1002',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 89990,
      buyerName: 'María González',
      sellerName: 'Electrónica Premium',
      vendorName: 'Electrónica Premium',
      products: [{
        productId: 'PROD-002',
        productName: 'iPhone 15 Pro',
        quantity: 1,
        price: 89990
      }],
      buyerEmail: 'maria.gonzalez@example.com',
      sellerEmail: 'ventas@premium.com',
      createdAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer', email: 'maria.gonzalez@example.com' }]
  },

  // ====== PLANTILLA 3: Estado de pedido cambiado ======
  {
    plantillaId: 3,
    name: 'Estado de pedido actualizado',
    eventData: {
      orderId: 'ORD-1003',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      oldStatus: 'Confirmado',
      newStatus: 'En preparación',
      status: 'En preparación',
      estadoPedido: 'En preparación',
      totalAmount: 35000,
      buyerName: 'Pedro Sánchez',
      productName: 'Teclado Mecánico RGB',
      changedAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer' }]
  },

  // ====== PLANTILLA 4: Pedido enviado ======
  {
    plantillaId: 4,
    name: 'Pedido enviado (Comprador)',
    eventData: {
      orderId: 'ORD-1004',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 25990,
      vendorName: 'Tienda Gamer',
      sellerName: 'Tienda Gamer',
      productName: 'Mouse Logitech G502',
      trackingNumber: 'TRACK-789456123',
      carrier: 'Chilexpress',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      shippedAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer' }]
  },

  // ====== PLANTILLA 5: Pedido cancelado (genérico) ======
  {
    plantillaId: 5,
    name: 'Pedido cancelado',
    eventData: {
      orderId: 'ORD-1005',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 15000,
      buyerName: 'Ana Torres',
      vendorName: 'Librería Digital',
      cancellationReason: 'Producto agotado',
      motivo: 'Producto agotado',
      estadoPedido: 'Cancelado',
      cancelledAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer' }]
  },

  // ====== PLANTILLA 6: Problema de pago ======
  {
    plantillaId: 6,
    name: 'Problema de pago (Vendedor)',
    eventData: {
      orderId: 'ORD-1006',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 67890,
      issueType: 'rechazado',
      tipo_problema: 'rechazado',
      rejectionReason: 'Fondos insuficientes',
      productName: 'Smart TV 55 pulgadas'
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller' }]
  },

  // ====== PLANTILLA 7: Pago confirmado (Comprador) ======
  {
    plantillaId: 7,
    name: 'Pago confirmado (Comprador)',
    eventData: {
      orderId: 'ORD-1007',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 12990,
      amount: 12990,
      monto: 12990,
      buyerName: 'Carlos Ramírez',
      vendorName: 'Tech Store',
      productName: 'Auriculares Bluetooth',
      paymentMethod: 'Tarjeta de crédito',
      confirmedAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer' }]
  },

  // ====== PLANTILLA 8: Pago rechazado (Comprador) ======
  {
    plantillaId: 8,
    name: 'Pago rechazado (Comprador)',
    eventData: {
      orderId: 'ORD-1008',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 54990,
      amount: 54990,
      paymentOutcome: 'rejected',
      rejectionReason: 'Fondos insuficientes',
      productName: 'Tablet Samsung Galaxy',
      paymentMethod: 'Tarjeta de débito'
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer' }]
  },

  // ====== PLANTILLA 9: Pago recibido (Vendedor) ======
  {
    plantillaId: 9,
    name: 'Pago recibido (Vendedor)',
    eventData: {
      orderId: 'ORD-1009',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 129990,
      amount: 129990,
      buyerName: 'Laura Martínez',
      productName: 'PlayStation 5',
      paymentMethod: 'Transferencia bancaria',
      confirmedAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller' }]
  },

  // ====== PLANTILLA 10: Venta cancelada por vendedor ======
  {
    plantillaId: 10,
    name: 'Venta cancelada por vendedor (notifica a Comprador)',
    eventData: {
      orderId: 'ORD-1010',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 34990,
      buyerName: 'Roberto Díaz',
      vendorName: 'Muebles Online',
      sellerName: 'Muebles Online',
      cancellationReason: 'Producto sin stock',
      motivo: 'Producto sin stock',
      estadoPedido: 'Cancelado',
      productName: 'Silla Gamer Ergonómica'
    },
    recipients: [{ userId: TEST_USERS.buyer, role: 'buyer' }]
  },

  // ====== PLANTILLA 11: Compra cancelada por comprador ======
  {
    plantillaId: 11,
    name: 'Compra cancelada por comprador (notifica a Vendedor)',
    eventData: {
      orderId: 'ORD-1011',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 28500,
      buyerName: 'Sofía Vargas',
      cancellationReason: 'Compré por error',
      motivo: 'Compré por error',
      estadoPedido: 'Pendiente',
      productName: 'Cafetera Nespresso'
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller' }]
  },

  // ====== PLANTILLA 12: Listo para despacho ======
  {
    plantillaId: 12,
    name: 'Pedido listo para despacho (Vendedor)',
    eventData: {
      orderId: 'ORD-1012',
      buyerId: TEST_USERS.buyer,
      sellerId: TEST_USERS.seller,
      totalAmount: 19990,
      buyerName: 'Diego Morales',
      productName: 'Mochila Deportiva',
      deliveryAddress: 'Av. Brasil 2950, Valparaíso',
      buyerPhone: '+56912345678',
      readyAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller' }]
  },

  // ====== PLANTILLA 13: Nuevo mensaje ======
  {
    plantillaId: 13,
    name: 'Nuevo mensaje recibido',
    eventData: {
      conversationId: 'CONV-456',
      orderId: 'ORD-1013',
      senderName: 'Juan Pérez',
      userName: 'Juan Pérez',
      messagePreview: 'Hola, ¿cuándo envías el producto?',
      mensaje: 'Hola, ¿cuándo envías el producto?',
      senderRole: 'buyer',
      receivedAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller' }]
  },

  // ====== PLANTILLA 14: Producto editado ======
  {
    plantillaId: 14,
    name: 'Producto editado',
    eventData: {
      productId: 'PROD-789',
      productName: 'Laptop Dell',
      producto: 'Laptop Dell',
      changedFields: ['precio', 'stock'],
      campos: 'precio, stock',
      oldPrice: 45990,
      newPrice: 42990,
      oldStock: 5,
      newStock: 3,
      editedAt: new Date().toISOString()
    },
    recipients: [{ userId: TEST_USERS.seller, role: 'seller' }]
  }
];

class NotificationTester {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Crear una notificación de prueba
   */
  async createTestNotification(test: TestNotification): Promise<void> {
    try {
      console.log(`\n📝 Probando: ${test.name} (Plantilla ${test.plantillaId})`);
      console.log(`   Usuario: ${test.recipients[0].userId} (${test.recipients[0].role})`);

      const response = await axios.post(`${this.baseUrl}/test-create`, {
        id_emisor: 'test-simulator',
        id_receptor: test.recipients[0].userId,
        id_plantilla: test.plantillaId,
        channel_ids: [1, 3], // Email y Push
        context: test.eventData
      });

      console.log(`   ✅ Notificación creada: ID ${response.data.id_notificacion}`);
      
      // Mostrar cómo se vería procesada
      await this.showProcessedNotification(test.recipients[0].userId);
      
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.error(`   Detalles: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  /**
   * Obtener y mostrar la última notificación procesada del usuario
   */
  async showProcessedNotification(userId: string): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/${userId}?limit=1`);
      const notifications = response.data;
      
      if (notifications && notifications.length > 0) {
        const notif = notifications[0];
        console.log(`   📧 Título: "${notif.title}"`);
        console.log(`   📄 Mensaje: "${notif.message}"`);
        console.log(`   🏷️  Tipo: ${notif.type}`);
        console.log(`   📊 Metadata:`, JSON.stringify(notif.metadata, null, 2));
      }
    } catch (error: any) {
      console.error(`   ⚠️  No se pudo obtener la notificación procesada`);
    }
  }

  /**
   * Ejecutar todas las pruebas
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 ===== INICIANDO PRUEBAS DE TODAS LAS PLANTILLAS =====\n');
    console.log(`Total de pruebas: ${NOTIFICATION_TESTS.length}\n`);

    for (const test of NOTIFICATION_TESTS) {
      await this.createTestNotification(test);
      // Esperar un poco entre pruebas para no saturar
      await this.sleep(500);
    }

    console.log('\n✅ ===== PRUEBAS COMPLETADAS =====');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Plantillas probadas: ${NOTIFICATION_TESTS.length}`);
    console.log(`   - Usuarios de prueba:`);
    console.log(`     * Comprador: ${TEST_USERS.buyer}`);
    console.log(`     * Vendedor: ${TEST_USERS.seller}`);
    console.log(`\n💡 Para ver todas las notificaciones:`);
    console.log(`   GET ${this.baseUrl}/user/${TEST_USERS.buyer}`);
    console.log(`   GET ${this.baseUrl}/user/${TEST_USERS.seller}`);
  }

  /**
   * Probar una plantilla específica
   */
  async testSpecificTemplate(plantillaId: number): Promise<void> {
    const test = NOTIFICATION_TESTS.find(t => t.plantillaId === plantillaId);
    
    if (!test) {
      console.error(`❌ No se encontró prueba para plantilla ${plantillaId}`);
      return;
    }

    await this.createTestNotification(test);
  }

  /**
   * Limpiar notificaciones de prueba (opcional)
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Limpiando notificaciones de prueba...');
    // Aquí podrías implementar lógica para eliminar notificaciones de prueba
    console.log('   ℹ️  Implementar si es necesario');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== EJECUCIÓN =====

async function main() {
  const tester = new NotificationTester();

  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Script de Prueba de Notificaciones

Uso:
  npm run test:notifications              # Probar todas las plantillas
  npm run test:notifications -- --id 5    # Probar solo plantilla 5
  npm run test:notifications -- --cleanup # Limpiar notificaciones de prueba

Opciones:
  --id <número>    Probar solo una plantilla específica
  --cleanup        Limpiar notificaciones de prueba
  --help, -h       Mostrar esta ayuda
    `);
    return;
  }

  if (args.includes('--cleanup')) {
    await tester.cleanup();
    return;
  }

  const idIndex = args.indexOf('--id');
  if (idIndex !== -1 && args[idIndex + 1]) {
    const plantillaId = parseInt(args[idIndex + 1]);
    await tester.testSpecificTemplate(plantillaId);
  } else {
    await tester.runAllTests();
  }
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
