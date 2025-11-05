/**
 * 🔗 ALTERNATIVA 2: WEBHOOKS
 * Los otros servicios llaman a tu microservicio cuando algo cambia
 */

// ============================================
// 📞 ENDPOINTS WEBHOOK PARA RECIBIR EVENTOS
// ============================================

/**
 * Los otros microservicios harían llamadas HTTP como estas:
 * 
 * POST http://tu-notificaciones-service/api/webhooks/order-created
 * POST http://tu-notificaciones-service/api/webhooks/payment-confirmed
 * POST http://tu-notificaciones-service/api/webhooks/payment-rejected
 */

const WEBHOOK_EXAMPLES = {
  
  // 📦 Cuando se crea una orden
  order_created: {
    url: "POST /api/webhooks/order-created",
    payload: {
      orderId: "ORD-123",
      buyerId: "buyer-uuid-456",
      sellerId: "seller-uuid-789", 
      totalAmount: 299.99,
      products: [
        { productId: "LAPTOP-001", name: "Laptop HP", price: 299.99 }
      ],
      timestamp: "2025-11-04T10:30:00Z"
    }
  },

  // 💳 Cuando se confirma un pago
  payment_confirmed: {
    url: "POST /api/webhooks/payment-confirmed",
    payload: {
      paymentId: "PAY-456",
      orderId: "ORD-123",
      buyerId: "buyer-uuid-456",
      sellerId: "seller-uuid-789",
      amount: 299.99,
      paymentMethod: "credit_card",
      timestamp: "2025-11-04T10:32:00Z"
    }
  },

  // ❌ Cuando se rechaza un pago
  payment_rejected: {
    url: "POST /api/webhooks/payment-rejected", 
    payload: {
      paymentId: "PAY-789",
      orderId: "ORD-124",
      buyerId: "buyer-uuid-111",
      amount: 150.50,
      reason: "insufficient_funds",
      timestamp: "2025-11-04T10:35:00Z"
    }
  }
};

// ============================================
// 🎯 IMPLEMENTACIÓN SIMPLE DE WEBHOOKS
// ============================================

/**
 * Controlador para recibir webhooks (agregar a notifications.controller.ts)
 */
const WEBHOOK_CONTROLLER_CODE = `
// Agregar estos endpoints a NotificationsController

@Post('/webhooks/order-created')
async handleOrderCreated(@Body() payload: any) {
  this.logger.log('📦 Webhook: Order created - ' + payload.orderId);
  
  // Notificar al comprador
  await this.notificationsService.createSimpleNotification({
    id_emisor: 'system',
    id_receptor: payload.buyerId,
    id_plantilla: 1, // "Tu orden fue creada"
    channel_ids: [1, 2], // Email + SMS
    metadata: {
      numero_orden: payload.orderId,
      monto: payload.totalAmount
    }
  });

  // Notificar al vendedor
  await this.notificationsService.createSimpleNotification({
    id_emisor: 'system', 
    id_receptor: payload.sellerId,
    id_plantilla: 2, // "Tienes una nueva venta"
    channel_ids: [1], // Solo email
    metadata: {
      numero_orden: payload.orderId,
      monto: payload.totalAmount
    }
  });

  return { status: 'success', message: 'Notifications created' };
}

@Post('/webhooks/payment-confirmed')
async handlePaymentConfirmed(@Body() payload: any) {
  this.logger.log('💳 Webhook: Payment confirmed - ' + payload.paymentId);
  
  await this.notificationsService.createSimpleNotification({
    id_emisor: 'system',
    id_receptor: payload.sellerId,
    id_plantilla: 6, // "Pago recibido"
    channel_ids: [1],
    metadata: {
      monto: payload.amount,
      numero_orden: payload.orderId
    }
  });

  return { status: 'success' };
}

@Post('/webhooks/payment-rejected')
async handlePaymentRejected(@Body() payload: any) {
  this.logger.log('❌ Webhook: Payment rejected - ' + payload.paymentId);
  
  await this.notificationsService.createSimpleNotification({
    id_emisor: 'system',
    id_receptor: payload.buyerId,
    id_plantilla: 7, // "Problema con tu pago"
    channel_ids: [1, 2],
    metadata: {
      monto: payload.amount,
      tipo_problema: payload.reason,
      accion_requerida: 'reintentar_pago'
    }
  });

  return { status: 'success' };
}
`;

// ============================================
// 🔄 ALTERNATIVA 3: DATABASE TRIGGERS
// ============================================

const DATABASE_TRIGGERS_EXAMPLE = {
  description: "Los otros servicios usan triggers de BD para notificar cambios",
  
  mongodb_change_streams: {
    concept: "Escuchar cambios en tiempo real en colecciones de MongoDB",
    example: `
    // En tu microservicio, escuchar cambios en BD de órdenes
    const ordersDb = client.db('OrdersService');
    const ordersCollection = ordersDb.collection('orders');
    
    const changeStream = ordersCollection.watch();
    changeStream.on('change', (change) => {
      if (change.operationType === 'insert') {
        // Nueva orden creada
        this.handleNewOrder(change.fullDocument);
      }
      if (change.operationType === 'update') {
        // Orden actualizada  
        this.handleOrderUpdate(change.fullDocument);
      }
    });
    `
  },

  postgresql_triggers: {
    concept: "Usar triggers de PostgreSQL para enviar notificaciones HTTP",
    example: `
    -- En la BD de pagos, crear trigger que llame a tu API
    CREATE OR REPLACE FUNCTION notify_payment_change()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Llamar a tu microservicio de notificaciones
        PERFORM http_post(
            'http://notifications-service/api/webhooks/payment-updated',
            json_build_object(
                'paymentId', NEW.payment_id,
                'status', NEW.status,
                'orderId', NEW.order_id
            )::text
        );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER payment_status_trigger
        AFTER UPDATE ON payments
        FOR EACH ROW
        EXECUTE FUNCTION notify_payment_change();
    `
  }
};

// ============================================
// 🔄 ALTERNATIVA 4: SHARED DATABASE
// ============================================

const SHARED_DATABASE_APPROACH = {
  concept: "Todos los microservicios escriben eventos en una BD compartida",
  
  structure: {
    database: "SharedEventsDB",
    table: "events_log",
    schema: {
      id: "uuid",
      service_name: "string", // 'orders-service', 'payments-service'
      event_type: "string",   // 'order_created', 'payment_confirmed'
      entity_id: "string",    // 'ORD-123', 'PAY-456'
      data: "json",           // Los datos del evento
      processed: "boolean",   // Si ya fue procesado por notificaciones
      created_at: "timestamp"
    }
  },

  how_it_works: [
    "1. Otros servicios insertan eventos en events_log",
    "2. Tu microservicio consulta eventos no procesados",
    "3. Procesas eventos y marcas processed = true",
    "4. Creas notificaciones según el tipo de evento"
  ],

  example_queries: {
    insert_event: `
      INSERT INTO events_log (service_name, event_type, entity_id, data, processed)
      VALUES ('orders-service', 'order_created', 'ORD-123', '{"buyerId": "user-456", "amount": 299.99}', false)
    `,
    
    get_unprocessed: `
      SELECT * FROM events_log 
      WHERE processed = false 
      ORDER BY created_at ASC 
      LIMIT 50
    `,
    
    mark_processed: `
      UPDATE events_log 
      SET processed = true 
      WHERE id = $1
    `
  }
};

// ============================================
// 📊 COMPARACIÓN DE ALTERNATIVAS
// ============================================

const ALTERNATIVES_COMPARISON = {
  
  "🔗 Webhooks": {
    complexity: "Baja",
    latency: "Inmediata", 
    reliability: "Media",
    setup_effort: "1-2 horas",
    pros: ["Inmediato", "Simple", "No infraestructura extra"],
    cons: ["Manejo de fallos manual", "Dependencia de red", "Otros servicios deben implementar"]
  },

  "📡 API Polling": {
    complexity: "Baja",
    latency: "15-30 segundos",
    reliability: "Alta", 
    setup_effort: "2-3 horas",
    pros: ["Control total", "Fácil debugging", "Robusto"],
    cons: ["Mayor latencia", "Más carga en APIs", "Consume más recursos"]
  },

  "💾 Database Triggers": {
    complexity: "Media", 
    latency: "Inmediata",
    reliability: "Alta",
    setup_effort: "3-4 horas", 
    pros: ["Automático", "Confiable", "Sin cambios en aplicación"],
    cons: ["Acoplamiento a BD", "Más complejo", "Específico por BD"]
  },

  "📚 Shared Database": {
    complexity: "Media",
    latency: "5-15 segundos", 
    reliability: "Alta",
    setup_effort: "4-5 horas",
    pros: ["Transaccional", "Auditable", "Escalable"],
    cons: ["BD compartida", "Más infraestructura", "Acoplamiento"]
  },

  "⚡ Kafka Events": {
    complexity: "Alta",
    latency: "Inmediata",
    reliability: "Muy Alta", 
    setup_effort: "8-12 horas",
    pros: ["Escalable", "Desacoplado", "Estándar industria"],
    cons: ["Complejo", "Infraestructura", "Curva de aprendizaje"]
  }
};

// ============================================
// 🎯 RECOMENDACIÓN SEGÚN CONTEXTO
// ============================================

const RECOMMENDATIONS = {
  
  "Para MVP/Prototipo": {
    recommended: "🔗 Webhooks",
    reason: "Rápido de implementar, otros equipos agregan 1 línea de código",
    implementation_time: "1-2 horas"
  },

  "Para Producción Pequeña": {
    recommended: "📡 API Polling", 
    reason: "No requiere cambios en otros servicios, control total",
    implementation_time: "2-3 horas"
  },

  "Para Producción Mediana": {
    recommended: "📚 Shared Database",
    reason: "Confiable, auditable, sin dependencias de red",
    implementation_time: "4-5 horas"
  },

  "Para Producción Grande": {
    recommended: "⚡ Kafka Events",
    reason: "Escalable, estándar industria, desacoplado",
    implementation_time: "8-12 horas"
  }
};

console.log("🔄 ALTERNATIVAS A KAFKA CARGADAS");
console.log("📊 Total de opciones:", Object.keys(ALTERNATIVES_COMPARISON).length);

export {
  WEBHOOK_EXAMPLES,
  WEBHOOK_CONTROLLER_CODE, 
  DATABASE_TRIGGERS_EXAMPLE,
  SHARED_DATABASE_APPROACH,
  ALTERNATIVES_COMPARISON,
  RECOMMENDATIONS
};