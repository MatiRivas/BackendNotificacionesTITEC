/**
 * 📋 DOCUMENTACIÓN DE ENDPOINTS ACTIVOS
 * Backend Notificaciones TITEC - Microservicio de Notificaciones
 * Version: 2.0.0 (Microservices Architecture)
 * 
 * Todos los endpoints están bajo el prefijo: /api/notifications
 */

// ============================================
// 🏠 ENDPOINT BASE DE LA APLICACIÓN
// ============================================

/**
 * GET /
 * Información general del microservicio
 */
const APP_INFO = {
  endpoint: "GET /",
  description: "Información general del microservicio",
  response: {
    message: "🚀 TITEC - Microservicio de Notificaciones (Microservices Architecture)",
    version: "2.0.0",
    status: "Operational",
    timestamp: "2025-11-04T10:30:00.000Z",
    architecture: "Microservices - Pure Notifications Service",
    endpoints: {
      notifications: {
        getUserNotifications: "GET /api/notifications/user/:userId",
        getStats: "GET /api/notifications/stats",
        retryFailed: "POST /api/notifications/retry-failed",
        healthCheck: "GET /api/notifications/health/email",
        testEmail: "POST /api/notifications/test/email"
      }
    }
  }
};

// ============================================
// 📱 ENDPOINTS DE NOTIFICACIONES PRINCIPALES
// ============================================

/**
 * POST /api/notifications/test-create
 * Crear notificación de prueba (NUEVO - Simplificado)
 */
const TEST_CREATE_NOTIFICATION = {
  endpoint: "POST /api/notifications/test-create",
  description: "Crear una notificación de prueba con estructura simplificada",
  body: {
    id_emisor: "system",
    id_receptor: "user-uuid-123",
    id_plantilla: 1,
    channel_ids: [1, 2],
    metadata: {
      monto: 150.50,
      tipo_problema: "rechazado",
      accion_requerida: "reintentar_pago"
    }
  },
  response: {
    id_notificacion: 12,
    fecha_hora: "2025-11-04T10:30:00.000Z",
    id_emisor: "system",
    id_receptor: "user-uuid-123",
    id_plantilla: 1,
    channel_ids: [1, 2],
    estado: "pendiente",
    metadata: {
      monto: 150.50,
      tipo_problema: "rechazado",
      accion_requerida: "reintentar_pago"
    }
  }
};

/**
 * POST /api/notifications/create
 * Crear notificación estándar
 */
const CREATE_NOTIFICATION = {
  endpoint: "POST /api/notifications/create",
  description: "Crear una notificación usando el sistema estándar",
  body: {
    id_emisor: 1,
    id_receptor: 2,
    id_plantilla: 1,
    channel_ids: [1, 2]
  },
  response: {
    id_notificacion: 13,
    fecha_hora: "2025-11-04T10:30:00.000Z",
    id_emisor: 1,
    id_receptor: 2,
    id_plantilla: 1,
    channel_ids: [1, 2],
    estado: "pendiente"
  }
};

/**
 * GET /api/notifications/user/:userId
 * Obtener notificaciones de un usuario específico
 */
const GET_USER_NOTIFICATIONS = {
  endpoint: "GET /api/notifications/user/:userId",
  description: "Obtener todas las notificaciones de un usuario",
  parameters: {
    userId: "ID del usuario (number)",
    page: "Número de página (opcional, default: 1)",
    limit: "Límite de resultados (opcional, default: 20)"
  },
  example: "GET /api/notifications/user/123?page=1&limit=10",
  response: [
    {
      id_notificacion: 10,
      fecha_hora: "2025-11-04T10:25:00.000Z",
      id_emisor: "system",
      id_receptor: "123",
      id_plantilla: 1,
      channel_ids: [1, 2],
      estado: "enviado"
    },
    {
      id_notificacion: 11,
      fecha_hora: "2025-11-04T10:28:00.000Z",
      id_emisor: "system",
      id_receptor: "123",
      id_plantilla: 2,
      channel_ids: [1],
      estado: "pendiente"
    }
  ]
};

/**
 * GET /api/notifications/user-history/:userId
 * Obtener historial de notificaciones (compatibilidad)
 */
const GET_USER_HISTORY = {
  endpoint: "GET /api/notifications/user-history/:userId",
  description: "Obtener historial de notificaciones (endpoint de compatibilidad)",
  parameters: {
    userId: "ID del usuario (string)",
    page: "Número de página (opcional)",
    limit: "Límite de resultados (opcional)"
  },
  example: "GET /api/notifications/user-history/user-uuid-123",
  response: "Mismo formato que /user/:userId"
};

// ============================================
// 📊 ENDPOINTS DE ESTADÍSTICAS
// ============================================

/**
 * GET /api/notifications/stats
 * Estadísticas básicas de notificaciones
 */
const GET_STATS = {
  endpoint: "GET /api/notifications/stats",
  description: "Obtener estadísticas generales del sistema de notificaciones",
  response: {
    total: 156,
    pendientes: 12,
    enviados: 140,
    fallidos: 4,
    byStatus: {
      pendiente: 12,
      enviado: 140,
      fallido: 4
    },
    byChannel: {
      email: 0,
      sms: 0,
      push: 0
    },
    timestamp: "2025-11-04T10:30:00.000Z"
  }
};

/**
 * GET /api/notifications/history-stats
 * Estadísticas del historial (compatibilidad)
 */
const GET_HISTORY_STATS = {
  endpoint: "GET /api/notifications/history-stats",
  description: "Estadísticas del historial de notificaciones",
  response: "Mismo formato que /stats"
};

// ============================================
// 🔧 ENDPOINTS DE CONFIGURACIÓN Y DATOS
// ============================================

/**
 * GET /api/notifications/templates
 * Obtener todas las plantillas disponibles
 */
const GET_TEMPLATES = {
  endpoint: "GET /api/notifications/templates",
  description: "Obtener todas las plantillas de notificación disponibles",
  response: [
    {
      id_Plantilla: 1,
      id_tipo_plantilla: 1,
      descripción_base: "Nueva orden recibida",
      asunto_base: "Tienes una nueva orden"
    },
    {
      id_Plantilla: 2,
      id_tipo_plantilla: 1,
      descripción_base: "Orden confirmada",
      asunto_base: "Tu orden ha sido confirmada"
    }
  ]
};

/**
 * GET /api/notifications/channels
 * Obtener todos los canales disponibles
 */
const GET_CHANNELS = {
  endpoint: "GET /api/notifications/channels",
  description: "Obtener todos los canales de notificación disponibles",
  response: [
    {
      id_canal: 1,
      tipo_canal: "email",
      descripcion: "Notificaciones por correo electrónico"
    },
    {
      id_canal: 2,
      tipo_canal: "sms",
      descripcion: "Notificaciones por mensaje de texto"
    },
    {
      id_canal: 3,
      tipo_canal: "push",
      descripcion: "Notificaciones push"
    }
  ]
};

/**
 * GET /api/notifications/template-types
 * Obtener todos los tipos de plantilla
 */
const GET_TEMPLATE_TYPES = {
  endpoint: "GET /api/notifications/template-types",
  description: "Obtener todos los tipos de plantilla disponibles",
  response: [
    {
      id_tipo_plantilla: 1,
      tipo_plantilla: "orden"
    },
    {
      id_tipo_plantilla: 2,
      tipo_plantilla: "pago"
    }
  ]
};

// ============================================
// 🔄 ENDPOINTS DE MANTENIMIENTO
// ============================================

/**
 * POST /api/notifications/retry-failed
 * Reintentar notificaciones fallidas
 */
const RETRY_FAILED = {
  endpoint: "POST /api/notifications/retry-failed",
  description: "Reintentar el envío de notificaciones que fallaron",
  body: "No requiere body",
  response: {
    message: "Failed notifications retry initiated",
    retriedCount: 3
  }
};

/**
 * GET /api/notifications/health/email
 * Verificar estado del servicio de email
 */
const HEALTH_EMAIL = {
  endpoint: "GET /api/notifications/health/email",
  description: "Verificar la conectividad del servicio de email",
  response: {
    service: "email",
    status: "healthy", // o "unhealthy"
    timestamp: "2025-11-04T10:30:00.000Z"
  }
};

/**
 * POST /api/notifications/test/email
 * Enviar email de prueba
 */
const TEST_EMAIL = {
  endpoint: "POST /api/notifications/test/email",
  description: "Enviar un email de prueba para verificar funcionamiento",
  body: {
    to: "test@example.com",
    subject: "Email de prueba", // opcional
    content: "<h1>Contenido de prueba</h1>" // opcional
  },
  response: {
    success: true,
    message: "Test email sent successfully"
  }
};

// ============================================
// 📖 RESUMEN DE ENDPOINTS DISPONIBLES
// ============================================

const ENDPOINTS_SUMMARY = {
  total_endpoints: 12,
  categories: {
    "📱 Principales": [
      "POST /api/notifications/test-create",
      "POST /api/notifications/create", 
      "GET /api/notifications/user/:userId"
    ],
    "📊 Estadísticas": [
      "GET /api/notifications/stats",
      "GET /api/notifications/history-stats"
    ],
    "🔧 Configuración": [
      "GET /api/notifications/templates",
      "GET /api/notifications/channels", 
      "GET /api/notifications/template-types"
    ],
    "🔄 Mantenimiento": [
      "POST /api/notifications/retry-failed",
      "GET /api/notifications/health/email",
      "POST /api/notifications/test/email"
    ],
    "🏠 Sistema": [
      "GET /"
    ]
  },
  architecture: "Microservices",
  external_dependencies: [
    "Users API Service (http://localhost:3001)",
    "MongoDB Database",
    "Email Service (SMTP)",
    "Kafka (para eventos)"
  ]
};

// ============================================
// 🚀 INFORMACIÓN DE DESPLIEGUE
// ============================================

const DEPLOYMENT_INFO = {
  port: 3000,
  base_url: "http://localhost:3000",
  api_prefix: "/api",
  database: "MongoDB (Notificaciones)",
  environment_variables: [
    "NODE_ENV=production",
    "PORT=3000", 
    "MONGODB_URI=mongodb+srv://...",
    "USERS_SERVICE_URL=http://localhost:3001",
    "JWT_SECRET=...",
    "DEFAULT_NOTIFICATION_CHANNELS=1,2"
  ]
};

console.log("📋 DOCUMENTACIÓN DE ENDPOINTS CARGADA");
console.log("🔗 Base URL:", DEPLOYMENT_INFO.base_url);
console.log("📱 Total de endpoints:", ENDPOINTS_SUMMARY.total_endpoints);
console.log("🏗️ Arquitectura:", ENDPOINTS_SUMMARY.architecture);

export {
  APP_INFO,
  TEST_CREATE_NOTIFICATION,
  CREATE_NOTIFICATION,
  GET_USER_NOTIFICATIONS,
  GET_USER_HISTORY,
  GET_STATS,
  GET_HISTORY_STATS,
  GET_TEMPLATES,
  GET_CHANNELS,
  GET_TEMPLATE_TYPES,
  RETRY_FAILED,
  HEALTH_EMAIL,
  TEST_EMAIL,
  ENDPOINTS_SUMMARY,
  DEPLOYMENT_INFO
};