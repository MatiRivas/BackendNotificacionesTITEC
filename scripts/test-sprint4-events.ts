/**
 * Script de Prueba - Eventos del Sprint 4
 * 
 * Este script simula eventos de Kafka específicos del Sprint 4:
 * - HDU2: Pedido listo para despacho (order_ready_to_ship)
 * - HDU3: Nuevo mensaje recibido (message_received)
 * - HDU4: Producto editado (product_edited)
 * 
 * Uso:
 *   npm run test:sprint4
 *   npm run test:sprint4 -- --event ready-to-ship
 *   npm run test:sprint4 -- --event message
 *   npm run test:sprint4 -- --event product-edit
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Usuarios de prueba
const TEST_USERS = {
  buyer: 'buyer-test-123',
  seller: 'seller-test-456',
  buyerEmail: 'buyer@test.com',
  sellerEmail: 'seller@test.com',
};

interface TestScenario {
  name: string;
  description: string;
  topic: string;
  eventType: string;
  eventData: any;
  expectedNotification: {
    recipient: string;
    role: 'buyer' | 'seller';
    templateId: number;
  };
}

// Escenarios de prueba para Sprint 4
const SPRINT4_SCENARIOS: TestScenario[] = [
  // ===== HDU2: Pedido listo para despacho =====
  {
    name: 'HDU2 - Pedido Listo para Despacho',
    description: 'Notificar al vendedor que un pedido está listo para ser enviado',
    topic: 'orders.status_changed',
    eventType: 'order_ready_to_ship',
    eventData: {
      orderId: 'ORD-READY-001',
      buyerId: TEST_USERS.buyer,
      buyerName: 'María González',
      buyerEmail: TEST_USERS.buyerEmail,
      buyerAddress: 'Av. Providencia 1234, Santiago',
      buyerPhone: '+56912345678',
      sellerId: TEST_USERS.seller,
      sellerEmail: TEST_USERS.sellerEmail,
      productId: 'PROD-MAC-003',
      productName: 'MacBook Pro 13" M2',
      orderDate: new Date().toISOString(),
      totalAmount: 1299990,
      oldStatus: 'preparing',
      newStatus: 'Listo para despacho', // Estado clave que activa la notificación
      changedAt: new Date().toISOString(),
    },
    expectedNotification: {
      recipient: TEST_USERS.seller,
      role: 'seller',
      templateId: 12,
    },
  },

  // ===== HDU3: Nuevo mensaje recibido =====
  {
    name: 'HDU3a - Mensaje del Comprador al Vendedor',
    description: 'Notificar al vendedor que recibió un mensaje del comprador',
    topic: 'messages.received',
    eventType: 'message_received',
    eventData: {
      messageId: 'MSG-001',
      conversationId: 'CONV-456',
      senderId: TEST_USERS.buyer,
      senderName: 'Carlos Ramírez',
      senderRole: 'buyer',
      receiverId: TEST_USERS.seller,
      receiverRole: 'seller',
      messageContent: '¿Hola, el producto tiene garantía? ¿Cuándo lo puedes enviar?',
      messagePreview: '¿Hola, el producto tiene garantía? ¿Cuándo...',
      productId: 'PROD-IP-007',
      productName: 'iPhone 14 Pro 256GB',
      orderId: 'ORD-MSG-001',
      receivedAt: new Date().toISOString(),
    },
    expectedNotification: {
      recipient: TEST_USERS.seller,
      role: 'seller',
      templateId: 13,
    },
  },

  {
    name: 'HDU3b - Mensaje del Vendedor al Comprador',
    description: 'Notificar al comprador que recibió respuesta del vendedor',
    topic: 'messages.received',
    eventType: 'message_received',
    eventData: {
      messageId: 'MSG-002',
      conversationId: 'CONV-456',
      senderId: TEST_USERS.seller,
      senderName: 'TechStore Chile',
      senderRole: 'seller',
      receiverId: TEST_USERS.buyer,
      receiverRole: 'buyer',
      messageContent: 'Sí, el producto tiene 1 año de garantía. Lo enviaré mañana.',
      messagePreview: 'Sí, el producto tiene 1 año de garantía...',
      productId: 'PROD-IP-007',
      productName: 'iPhone 14 Pro 256GB',
      orderId: 'ORD-MSG-001',
      receivedAt: new Date().toISOString(),
    },
    expectedNotification: {
      recipient: TEST_USERS.buyer,
      role: 'buyer',
      templateId: 13,
    },
  },

  // ===== HDU4: Producto editado =====
  {
    name: 'HDU4a - Edición de Precio',
    description: 'Notificar al vendedor que su producto fue editado (cambio de precio)',
    topic: 'products.edited',
    eventType: 'product_edited',
    eventData: {
      productId: 'PROD-EDIT-001',
      productName: 'Samsung Galaxy S23 Ultra',
      sellerId: TEST_USERS.seller,
      sellerEmail: TEST_USERS.sellerEmail,
      changedFields: ['price'],
      oldPrice: 699990,
      newPrice: 649990,
      oldStock: 5,
      newStock: 5,
      editedAt: new Date().toISOString(),
      editedBy: TEST_USERS.seller, // El vendedor editó su propio producto
    },
    expectedNotification: {
      recipient: TEST_USERS.seller,
      role: 'seller',
      templateId: 14,
    },
  },

  {
    name: 'HDU4b - Edición de Stock',
    description: 'Notificar al vendedor que actualizó el stock de su producto',
    topic: 'products.edited',
    eventType: 'product_edited',
    eventData: {
      productId: 'PROD-EDIT-002',
      productName: 'AirPods Pro 2da Gen',
      sellerId: TEST_USERS.seller,
      sellerEmail: TEST_USERS.sellerEmail,
      changedFields: ['stock'],
      oldPrice: 189990,
      newPrice: 189990,
      oldStock: 3,
      newStock: 10,
      editedAt: new Date().toISOString(),
      editedBy: TEST_USERS.seller,
    },
    expectedNotification: {
      recipient: TEST_USERS.seller,
      role: 'seller',
      templateId: 14,
    },
  },

  {
    name: 'HDU4c - Edición Múltiple (Precio + Stock + Descripción)',
    description: 'Notificar cambios múltiples en un producto',
    topic: 'products.edited',
    eventType: 'product_edited',
    eventData: {
      productId: 'PROD-EDIT-003',
      productName: 'Sony WH-1000XM5 Auriculares',
      sellerId: TEST_USERS.seller,
      sellerEmail: TEST_USERS.sellerEmail,
      changedFields: ['price', 'stock', 'description'],
      oldPrice: 299990,
      newPrice: 279990,
      oldStock: 2,
      newStock: 8,
      oldDescription: 'Auriculares con cancelación de ruido',
      newDescription: 'Auriculares premium con cancelación de ruido activa y 30h de batería',
      editedAt: new Date().toISOString(),
      editedBy: TEST_USERS.seller,
    },
    expectedNotification: {
      recipient: TEST_USERS.seller,
      role: 'seller',
      templateId: 14,
    },
  },
];

class Sprint4EventTester {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Simular un evento de Kafka del Sprint 4
   */
  async simulateEvent(scenario: TestScenario): Promise<void> {
    try {
      console.log(`\n🧪 ${scenario.name}`);
      console.log(`   📋 ${scenario.description}`);
      console.log(`   📡 Topic: ${scenario.topic}`);
      console.log(`   🔔 Destinatario: ${scenario.expectedNotification.recipient} (${scenario.expectedNotification.role})`);
      console.log(`   📄 Plantilla esperada: ${scenario.expectedNotification.templateId}`);

      // Crear notificación usando el endpoint de eventos
      const response = await axios.post(`${this.baseUrl}/notificaciones/from-event`, {
        eventType: scenario.eventType,
        eventData: scenario.eventData,
        recipients: [{
          userId: scenario.expectedNotification.recipient,
          email: scenario.expectedNotification.role === 'buyer' ? TEST_USERS.buyerEmail : TEST_USERS.sellerEmail,
          role: scenario.expectedNotification.role,
        }],
        templateType: scenario.eventType,
        channels: ['email', 'push'],
        priority: 'high',
      });

      console.log(`   ✅ Evento procesado correctamente`);
      console.log(`   📬 Notificación ID: ${response.data.id_notificacion || response.data._id}`);

      // Mostrar la notificación procesada
      await this.showProcessedNotification(scenario.expectedNotification.recipient);

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.error(`   Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }

  /**
   * Obtener y mostrar la última notificación del usuario
   */
  async showProcessedNotification(userId: string): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/notificaciones/user/${userId}?limit=1`);
      const notifications = response.data;
      
      if (notifications && notifications.length > 0) {
        const notif = notifications[0];
        console.log(`\n   📧 Notificación Procesada:`);
        console.log(`      Título: "${notif.title}"`);
        console.log(`      Mensaje: "${notif.message}"`);
        console.log(`      Tipo: ${notif.type}`);
        console.log(`      Canales: ${notif.channels?.join(', ')}`);
        
        if (notif.metadata && Object.keys(notif.metadata).length > 0) {
          console.log(`      Metadata:`);
          Object.entries(notif.metadata).forEach(([key, value]) => {
            console.log(`         ${key}: ${JSON.stringify(value)}`);
          });
        }
      }
    } catch (error: any) {
      console.error(`   ⚠️  No se pudo obtener la notificación procesada`);
    }
  }

  /**
   * Ejecutar todas las pruebas del Sprint 4
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 ===== PRUEBAS DE EVENTOS SPRINT 4 =====\n');
    console.log(`Total de escenarios: ${SPRINT4_SCENARIOS.length}\n`);

    for (const scenario of SPRINT4_SCENARIOS) {
      await this.simulateEvent(scenario);
      await this.sleep(1000); // Esperar 1 segundo entre pruebas
    }

    console.log('\n✅ ===== PRUEBAS COMPLETADAS =====');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Escenarios probados: ${SPRINT4_SCENARIOS.length}`);
    console.log(`   - HDU2 (Listo para despacho): 1 escenario`);
    console.log(`   - HDU3 (Mensajes): 2 escenarios`);
    console.log(`   - HDU4 (Productos editados): 3 escenarios`);
    console.log(`\n💡 Para ver las notificaciones:`);
    console.log(`   GET ${this.baseUrl}/notificaciones/user/${TEST_USERS.buyer}`);
    console.log(`   GET ${this.baseUrl}/notificaciones/user/${TEST_USERS.seller}`);
  }

  /**
   * Probar un evento específico por nombre
   */
  async testSpecificEvent(eventName: string): Promise<void> {
    const scenario = SPRINT4_SCENARIOS.find(s => 
      s.name.toLowerCase().includes(eventName.toLowerCase()) ||
      s.eventType.includes(eventName)
    );
    
    if (!scenario) {
      console.error(`❌ No se encontró escenario para: ${eventName}`);
      console.log('\n📋 Escenarios disponibles:');
      SPRINT4_SCENARIOS.forEach(s => console.log(`   - ${s.name}`));
      return;
    }

    await this.simulateEvent(scenario);
  }

  /**
   * Probar eventos por HDU
   */
  async testByHDU(hduNumber: number): Promise<void> {
    const hduScenarios = SPRINT4_SCENARIOS.filter(s => 
      s.name.includes(`HDU${hduNumber}`)
    );

    if (hduScenarios.length === 0) {
      console.error(`❌ No se encontraron escenarios para HDU${hduNumber}`);
      return;
    }

    console.log(`\n🎯 Probando HDU${hduNumber} (${hduScenarios.length} escenarios)\n`);

    for (const scenario of hduScenarios) {
      await this.simulateEvent(scenario);
      await this.sleep(1000);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== EJECUCIÓN =====

async function main() {
  const tester = new Sprint4EventTester();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Script de Prueba - Eventos Sprint 4

Uso:
  npm run test:sprint4                       # Probar todos los escenarios
  npm run test:sprint4 -- --event ready      # Probar evento específico
  npm run test:sprint4 -- --hdu 2            # Probar todos los escenarios de HDU2

Opciones:
  --event <nombre>  Probar evento específico (ready-to-ship, message, product-edit)
  --hdu <número>    Probar todos los escenarios de un HDU (2, 3, o 4)
  --help, -h        Mostrar esta ayuda

Ejemplos:
  npm run test:sprint4 -- --event ready      # HDU2: Listo para despacho
  npm run test:sprint4 -- --event message    # HDU3: Mensajes
  npm run test:sprint4 -- --event product    # HDU4: Productos editados
  npm run test:sprint4 -- --hdu 3            # Todos los escenarios de HDU3
    `);
    return;
  }

  const eventIndex = args.indexOf('--event');
  if (eventIndex !== -1 && args[eventIndex + 1]) {
    await tester.testSpecificEvent(args[eventIndex + 1]);
    return;
  }

  const hduIndex = args.indexOf('--hdu');
  if (hduIndex !== -1 && args[hduIndex + 1]) {
    const hduNumber = parseInt(args[hduIndex + 1]);
    await tester.testByHDU(hduNumber);
    return;
  }

  await tester.runAllTests();
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
