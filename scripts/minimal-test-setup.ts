/**
 * 💾 CONFIGURACIÓN MÍNIMA DE BD DE EVENTOS
 * Solo 3 colecciones para simular otros microservicios
 */

// ============================================
// 📋 ESTRUCTURA MÍNIMA REQUERIDA
// ============================================

const MINIMAL_EVENT_DB = {
  database: "EventsSimulator",
  collections: {
    
    // 📦 ÓRDENES (simula microservicio Orders)
    orders: {
      structure: {
        orderId: "string",      // ORD-123
        buyerId: "string",      // user-uuid
        sellerId: "string",     // user-uuid  
        status: "string",       // created, confirmed, shipped
        totalAmount: "number",  // 299.99
        createdAt: "Date",
        updatedAt: "Date"
      },
      events_generated: [
        "orders.created",
        "orders.status_changed", 
        "orders.cancelled"
      ]
    },

    // 💳 PAGOS (simula microservicio Payments)
    payments: {
      structure: {
        paymentId: "string",    // PAY-456
        orderId: "string",      // ORD-123
        amount: "number",       // 299.99
        status: "string",       // pending, confirmed, rejected
        reason: "string",       // insufficient_funds
        createdAt: "Date"
      },
      events_generated: [
        "payments.confirmed",
        "payments.rejected"
      ]
    },

    // 🚚 ENVÍOS (simula microservicio Shipping)  
    shipping: {
      structure: {
        shippingId: "string",   // SHIP-789
        orderId: "string",      // ORD-123
        status: "string",       // preparing, shipped, delivered
        trackingNumber: "string", // TRACK-ABC123
        updatedAt: "Date"
      },
      events_generated: [
        "shipping.updated"
      ]
    }
  }
};

// ============================================
// 🔧 SETUP RÁPIDO (MongoDB Compass)
// ============================================

const QUICK_SETUP_COMMANDS = [
  // 1. Crear base de datos
  'use EventsSimulator',
  
  // 2. Insertar datos de prueba para órdenes
  `db.orders.insertMany([
    {
      orderId: "ORD-001",
      buyerId: "buyer-123", 
      sellerId: "seller-456",
      status: "created",
      totalAmount: 199.99,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderId: "ORD-002", 
      buyerId: "buyer-789",
      sellerId: "seller-456", 
      status: "confirmed",
      totalAmount: 89.50,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])`,

  // 3. Insertar datos de prueba para pagos
  `db.payments.insertMany([
    {
      paymentId: "PAY-001",
      orderId: "ORD-001",
      amount: 199.99,
      status: "confirmed", 
      createdAt: new Date()
    },
    {
      paymentId: "PAY-002",
      orderId: "ORD-002", 
      amount: 89.50,
      status: "rejected",
      reason: "insufficient_funds",
      createdAt: new Date()
    }
  ])`
];

// ============================================
// ⚡ FUNCIONES HELPER PARA PRUEBAS RÁPIDAS
// ============================================

function generateOrderEvent(orderId: string) {
  return {
    topic: 'orders.created',
    message: {
      orderId,
      buyerId: `buyer-${Math.random().toString(36).substring(7)}`,
      sellerId: `seller-${Math.random().toString(36).substring(7)}`,
      totalAmount: Math.round(Math.random() * 500 * 100) / 100,
      createdAt: new Date().toISOString()
    }
  };
}

function generatePaymentEvent(orderId: string, success: boolean = true) {
  const base = {
    paymentId: `PAY-${Date.now()}`,
    orderId,
    amount: Math.round(Math.random() * 500 * 100) / 100
  };

  if (success) {
    return {
      topic: 'payments.confirmed',
      message: {
        ...base,
        confirmedAt: new Date().toISOString()
      }
    };
  } else {
    return {
      topic: 'payments.rejected', 
      message: {
        ...base,
        reason: 'insufficient_funds',
        rejectedAt: new Date().toISOString(),
        retryAction: 'update_payment_method'
      }
    };
  }
}

// ============================================
// 🧪 FUNCIÓN DE PRUEBA SUPER SIMPLE
// ============================================

async function quickTest() {
  console.log('🧪 PRUEBA RÁPIDA DE EVENTOS');
  console.log('===========================\n');
  
  // Generar 3 eventos de prueba
  const events = [
    generateOrderEvent('ORD-QUICK-001'),
    generatePaymentEvent('ORD-QUICK-001', true),
    generatePaymentEvent('ORD-QUICK-002', false)
  ];

  events.forEach((event, index) => {
    console.log(`${index + 1}. 📡 Evento: ${event.topic}`);
    console.log(`   📄 Datos:`, JSON.stringify(event.message, null, 2));
    console.log('');
  });

  console.log('💡 Para usar estos eventos:');
  console.log('1. Copiar los datos de message');
  console.log('2. Enviarlos via POST a tu microservicio');
  console.log('3. O usar KafkaJS para publicarlos\n');

  return events;
}

// ============================================
// 📝 RESUMEN DE ESFUERZO REQUERIDO
// ============================================

const EFFORT_SUMMARY = {
  time_required: "2-3 horas",
  complexity: "Muy Baja",
  steps: [
    "✅ Crear BD EventsSimulator (5 min)",
    "✅ Insertar datos de prueba (10 min)", 
    "✅ Usar scripts que ya creé (0 min)",
    "✅ Verificar notificaciones generadas (30 min)",
    "✅ Debugging y ajustes (1-2 horas)"
  ],
  benefits: [
    "🎯 Pruebas realistas sin depender de otros equipos",
    "🔄 Repetible y controlable",
    "📊 Datos consistentes para testing",
    "🐛 Facilita debugging de problemas",
    "📈 Permite simular diferentes escenarios"
  ],
  alternative: "Usar scripts que creé sin BD extra (30 min setup)"
};

console.log('📊 RESUMEN DE ESFUERZO:');
console.log(EFFORT_SUMMARY);

export {
  MINIMAL_EVENT_DB,
  QUICK_SETUP_COMMANDS,
  generateOrderEvent,
  generatePaymentEvent,
  quickTest,
  EFFORT_SUMMARY
};