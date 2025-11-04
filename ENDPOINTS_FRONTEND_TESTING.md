# 📋 DOCUMENTACIÓN COMPLETA DE ENDPOINTS PARA FRONTEND

**Base URL:** `http://localhost:3000/api`
**Fecha:** 29 de Octubre 2025
**Versión:** Sprint 2 - Completo

---

## 🔗 **ÍNDICE DE ENDPOINTS**

1. [Health Check](#1-health-check)
2. [Información General API](#2-información-general-api)
3. [Gestión de Preferencias](#3-gestión-de-preferencias)
4. [Notificaciones Internas](#4-notificaciones-internas)
5. [Plantillas y Canales](#5-plantillas-y-canales)
6. [Crear Notificaciones](#6-crear-notificaciones)
7. [Estadísticas](#7-estadísticas)
8. [Historial](#8-historial)
9. [Gestión de Estado](#9-gestión-de-estado)
10. [Testing y Health](#10-testing-y-health)

---

## 1️⃣ **HEALTH CHECK**

### `GET /api/health`
**Descripción:** Verificar estado del servidor

#### **Entrada:**
```
Ninguna
```

#### **Respuesta Exitosa (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-10-29T21:08:54.000Z",
  "uptime": 125.45,
  "environment": "development"
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/health"
```

---

## 2️⃣ **INFORMACIÓN GENERAL API**

### `GET /api`
**Descripción:** Información general de la API

#### **Entrada:**
```
Ninguna
```

#### **Respuesta Exitosa (200):**
```json
{
  "message": "Backend de Notificaciones TITEC",
  "version": "1.0.0",
  "environment": "development",
  "endpoints": {
    "notifications": "/api/notifications",
    "health": "/api/health",
    "docs": "/api/docs"
  },
  "features": [
    "Multi-channel notifications",
    "Kafka event processing",
    "User preferences",
    "Internal notifications",
    "Email/SMS/Push notifications"
  ]
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api"
```

---

## 3️⃣ **GESTIÓN DE PREFERENCIAS**

### `GET /api/notifications/user/:userId/preferences`
**Descripción:** Obtener preferencias de notificación de un usuario

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Entrada:**
```
URL: /api/notifications/user/user_12345/preferences
```

#### **Respuesta Exitosa (200):**
```json
{
  "userId": "user_12345",
  "preferredChannels": ["email", "internal"],
  "enableNotifications": true,
  "channelSettings": {
    "email": {
      "address": "usuario@ejemplo.com",
      "verified": true
    },
    "sms": {
      "phoneNumber": "+1234567890",
      "verified": false
    },
    "push": {
      "deviceTokens": ["token_abc123"],
      "enabled": true
    },
    "internal": {
      "enabled": true
    }
  },
  "notificationTypes": ["order", "payment", "shipping"],
  "lastUpdated": "2025-10-29T21:08:54.000Z"
}
```

#### **Respuesta Error (404):**
```json
{
  "statusCode": 404,
  "message": "User preferences not found",
  "error": "Not Found"
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/user/user_12345/preferences"
```

---

### `PUT /api/notifications/user/:userId/preferences`
**Descripción:** Actualizar preferencias de notificación de un usuario

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Entrada (Body JSON):**
```json
{
  "preferredChannels": ["email", "push", "internal"],
  "enableNotifications": true,
  "channelSettings": {
    "email": {
      "address": "nuevo@email.com",
      "verified": true
    },
    "push": {
      "enabled": true,
      "deviceTokens": ["nuevo_token_xyz789"]
    }
  },
  "notificationTypes": ["order", "payment"]
}
```

#### **Respuesta Exitosa (200):**
```json
{
  "userId": "user_12345",
  "preferredChannels": ["email", "push", "internal"],
  "enableNotifications": true,
  "channelSettings": {
    "email": {
      "address": "nuevo@email.com",
      "verified": true
    },
    "push": {
      "enabled": true,
      "deviceTokens": ["nuevo_token_xyz789"]
    },
    "internal": {
      "enabled": true
    }
  },
  "notificationTypes": ["order", "payment"],
  "lastUpdated": "2025-10-29T21:10:00.000Z"
}
```

#### **Comando de Prueba:**
```bash
curl -X PUT "http://localhost:3000/api/notifications/user/user_12345/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredChannels": ["email", "push"],
    "enableNotifications": true,
    "channelSettings": {
      "email": {
        "address": "test@ejemplo.com",
        "verified": true
      }
    },
    "notificationTypes": ["order", "payment"]
  }'
```

---

## 4️⃣ **NOTIFICACIONES INTERNAS**

### `GET /api/notifications/user/:userId/internal`
**Descripción:** Obtener notificaciones internas de un usuario

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Parámetros de Query (opcionales):**
- `limit` (number): Límite de resultados (default: 20)
- `offset` (number): Offset para paginación (default: 0)
- `unreadOnly` (boolean): Solo no leídas (default: false)

#### **Entrada:**
```
URL: /api/notifications/user/user_12345/internal?limit=10&unreadOnly=true
```

#### **Respuesta Exitosa (200):**
```json
[
  {
    "id": "notif_001",
    "userId": "user_12345",
    "title": "Pago Confirmado",
    "message": "Tu pago de $150.000 ha sido confirmado exitosamente",
    "type": "payment_confirmed",
    "priority": "high",
    "channel": "internal",
    "isRead": false,
    "createdAt": "2025-10-29T20:15:00.000Z",
    "sentAt": "2025-10-29T20:15:02.000Z",
    "metadata": {
      "orderId": "ORD-12345",
      "amount": 150000,
      "paymentMethod": "tarjeta_credito",
      "actionUrl": "/orders/ORD-12345"
    }
  },
  {
    "id": "notif_002",
    "userId": "user_12345",
    "title": "Problema con Pago - Acción Requerida",
    "message": "Hay una disputa abierta para tu venta. Debes responder con evidencia antes del 5 de noviembre.",
    "type": "payment_dispute",
    "priority": "urgent",
    "channel": "internal",
    "isRead": false,
    "createdAt": "2025-10-29T22:15:00.000Z",
    "sentAt": "2025-10-29T22:15:02.000Z",
    "metadata": {
      "isInternalFallback": false,
      "disputeId": "DISP-123",
      "evidenceUrl": "/seller/disputes/DISP-123/evidence",
      "responseDeadline": "2025-11-05T22:15:00.000Z",
      "urgentAction": true
    }
  }
]
```

#### **Respuesta Sin Notificaciones (200):**
```json
[]
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/user/user_12345/internal?limit=5&unreadOnly=true"
```

---

### `PATCH /api/notifications/:id/read`
**Descripción:** Marcar una notificación específica como leída

#### **Parámetros de URL:**
- `id` (string, required): ID de la notificación

#### **Entrada (Body JSON):**
```json
{
  "userId": "user_12345",
  "readAt": "2025-10-29T23:55:00.000Z"
}
```

**Nota:** `readAt` es opcional. Si no se proporciona, se usa la fecha/hora actual.

#### **Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "notificationId": "notif_001",
  "readAt": "2025-10-29T23:55:00.000Z"
}
```

#### **Respuesta Error (404):**
```json
{
  "statusCode": 404,
  "message": "Notification not found",
  "error": "Not Found"
}
```

#### **Comando de Prueba:**
```bash
curl -X PATCH "http://localhost:3000/api/notifications/notif_001/read" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345"
  }'
```

---

## 5️⃣ **PLANTILLAS Y CANALES**

### `GET /api/notifications/templates`
**Descripción:** Obtener todas las plantillas de notificación disponibles

#### **Entrada:**
```
Ninguna
```

#### **Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "order_created",
    "displayName": "Orden Creada",
    "description": "Notificación cuando se crea una nueva orden",
    "templateTypeId": 1,
    "isActive": true,
    "channels": ["email", "internal", "push"],
    "content": {
      "email": {
        "subject": "Nueva orden recibida #{{orderId}}",
        "body": "Tienes una nueva orden por ${{amount}} de {{customerName}}"
      },
      "internal": {
        "title": "Nueva Orden",
        "message": "Orden #{{orderId}} creada por {{customerName}}"
      }
    }
  },
  {
    "id": 2,
    "name": "payment_confirmed",
    "displayName": "Pago Confirmado",
    "description": "Notificación cuando se confirma un pago",
    "templateTypeId": 2,
    "isActive": true,
    "channels": ["email", "internal", "sms"],
    "content": {
      "email": {
        "subject": "Pago confirmado - Orden #{{orderId}}",
        "body": "Tu pago de ${{amount}} ha sido confirmado exitosamente"
      },
      "internal": {
        "title": "Pago Confirmado",
        "message": "Pago de ${{amount}} confirmado para orden #{{orderId}}"
      }
    }
  }
]
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/templates"
```

---

### `GET /api/notifications/channels`
**Descripción:** Obtener todos los canales de notificación disponibles

#### **Entrada:**
```
Ninguna
```

#### **Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "email",
    "displayName": "Correo Electrónico",
    "description": "Notificaciones por email",
    "isActive": true,
    "requiresVerification": true,
    "configFields": ["address", "verified"]
  },
  {
    "id": 2,
    "name": "sms",
    "displayName": "SMS",
    "description": "Notificaciones por mensaje de texto",
    "isActive": true,
    "requiresVerification": true,
    "configFields": ["phoneNumber", "verified"]
  },
  {
    "id": 3,
    "name": "push",
    "displayName": "Push Notification",
    "description": "Notificaciones push del navegador/app",
    "isActive": true,
    "requiresVerification": false,
    "configFields": ["deviceTokens", "enabled"]
  },
  {
    "id": 4,
    "name": "internal",
    "displayName": "Bandeja Interna",
    "description": "Notificaciones dentro de la plataforma",
    "isActive": true,
    "requiresVerification": false,
    "configFields": ["enabled"]
  }
]
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/channels"
```

---

### `GET /api/notifications/template-types`
**Descripción:** Obtener tipos de plantillas disponibles

#### **Entrada:**
```
Ninguna
```

#### **Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "order",
    "displayName": "Órdenes",
    "description": "Notificaciones relacionadas con órdenes",
    "category": "transactional"
  },
  {
    "id": 2,
    "name": "payment",
    "displayName": "Pagos",
    "description": "Notificaciones relacionadas con pagos",
    "category": "transactional"
  },
  {
    "id": 3,
    "name": "shipping",
    "displayName": "Envíos",
    "description": "Notificaciones relacionadas con envíos",
    "category": "transactional"
  },
  {
    "id": 4,
    "name": "system",
    "displayName": "Sistema",
    "description": "Notificaciones del sistema",
    "category": "system"
  }
]
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/template-types"
```

---

## 6️⃣ **CREAR NOTIFICACIONES**

### `POST /api/notifications/create`
**Descripción:** Crear una nueva notificación

#### **Entrada (Body JSON):**
```json
{
  "userId": "user_12345",
  "templateId": 1,
  "channels": ["email", "internal"],
  "priority": "high",
  "data": {
    "orderId": "ORD-67890",
    "customerName": "Juan Pérez",
    "amount": 250000,
    "productName": "Laptop HP",
    "actionUrl": "/orders/ORD-67890"
  },
  "scheduleFor": "2025-10-29T22:00:00.000Z"
}
```

#### **Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "notification": {
    "id": "notif_003",
    "userId": "user_12345",
    "templateId": 1,
    "title": "Nueva Orden",
    "message": "Orden #ORD-67890 creada por Juan Pérez",
    "type": "order_created",
    "priority": "high",
    "channels": ["email", "internal"],
    "status": "pending",
    "createdAt": "2025-10-29T21:30:00.000Z",
    "scheduleFor": "2025-10-29T22:00:00.000Z",
    "metadata": {
      "orderId": "ORD-67890",
      "customerName": "Juan Pérez",
      "amount": 250000,
      "actionUrl": "/orders/ORD-67890"
    }
  }
}
```

#### **Respuesta Error (400):**
```json
{
  "statusCode": 400,
  "message": ["userId should not be empty", "templateId must be a number"],
  "error": "Bad Request"
}
```

#### **Comando de Prueba:**
```bash
curl -X POST "http://localhost:3000/api/notifications/create" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345",
    "templateId": 1,
    "channels": ["email", "internal"],
    "priority": "medium",
    "data": {
      "orderId": "ORD-TEST",
      "customerName": "Usuario Test",
      "amount": 100000
    }
  }'
```

---

## 7️⃣ **ESTADÍSTICAS**

### `GET /api/notifications/stats`
**Descripción:** Obtener estadísticas generales del sistema de notificaciones

#### **Parámetros de Query (opcionales):**
- `startDate` (string): Fecha inicio (ISO format)
- `endDate` (string): Fecha fin (ISO format)
- `groupBy` (string): Agrupar por 'day', 'week', 'month'

#### **Entrada:**
```
URL: /api/notifications/stats?startDate=2025-10-01&endDate=2025-10-29&groupBy=day
```

#### **Respuesta Exitosa (200):**
```json
{
  "totalNotifications": 1543,
  "period": {
    "startDate": "2025-10-01T00:00:00.000Z",
    "endDate": "2025-10-29T23:59:59.000Z"
  },
  "byStatus": {
    "sent": 1234,
    "pending": 45,
    "failed": 67,
    "read": 890
  },
  "byChannel": {
    "email": 678,
    "internal": 543,
    "push": 234,
    "sms": 88
  },
  "byType": {
    "order_created": 456,
    "payment_confirmed": 378,
    "payment_rejected": 23,
    "order_shipped": 345,
    "payment_dispute": 12
  },
  "successRate": 95.6,
  "averageDeliveryTime": 2.3,
  "timeline": [
    {
      "date": "2025-10-29",
      "sent": 89,
      "failed": 3,
      "read": 56
    }
  ]
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/stats?groupBy=day&startDate=2025-10-20"
```

---

### `GET /api/notifications/user/:userId/stats`
**Descripción:** Obtener estadísticas de notificaciones de un usuario específico

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Entrada:**
```
URL: /api/notifications/user/user_12345/stats
```

#### **Respuesta Exitosa (200):**
```json
{
  "userId": "user_12345",
  "totalNotifications": 67,
  "unreadCount": 5,
  "readCount": 62,
  "byChannel": {
    "email": 23,
    "internal": 34,
    "push": 8,
    "sms": 2
  },
  "byType": {
    "order_created": 12,
    "payment_confirmed": 15,
    "order_shipped": 18,
    "payment_dispute": 1,
    "system": 21
  },
  "recentActivity": [
    {
      "date": "2025-10-29",
      "received": 3,
      "read": 1
    },
    {
      "date": "2025-10-28",
      "received": 5,
      "read": 4
    }
  ],
  "preferences": {
    "preferredChannels": ["email", "internal"],
    "enableNotifications": true,
    "lastUpdated": "2025-10-29T18:00:00.000Z"
  }
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/user/user_12345/stats"
```

---

## 8️⃣ **HISTORIAL**

### `GET /api/notifications/user-history/:userId`
**Descripción:** Obtener historial completo de notificaciones de un usuario

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Parámetros de Query (opcionales):**
- `limit` (number): Límite de resultados (default: 50)
- `offset` (number): Offset para paginación (default: 0)
- `status` (string): Filtrar por estado ('sent', 'failed', 'read', 'pending')
- `type` (string): Filtrar por tipo de notificación
- `channel` (string): Filtrar por canal

#### **Entrada:**
```
URL: /api/notifications/user-history/user_12345?limit=10&status=sent&type=payment_confirmed
```

#### **Respuesta Exitosa (200):**
```json
{
  "userId": "user_12345",
  "total": 156,
  "limit": 10,
  "offset": 0,
  "notifications": [
    {
      "id": "notif_hist_001",
      "templateId": 2,
      "title": "Pago Confirmado",
      "message": "Tu pago de $150.000 ha sido confirmado",
      "type": "payment_confirmed",
      "priority": "high",
      "channel": "email",
      "status": "sent",
      "createdAt": "2025-10-29T20:15:00.000Z",
      "sentAt": "2025-10-29T20:15:02.000Z",
      "readAt": "2025-10-29T20:18:34.000Z",
      "deliveryTime": 2.1,
      "metadata": {
        "orderId": "ORD-12345",
        "amount": 150000,
        "paymentMethod": "tarjeta_credito"
      }
    }
  ],
  "pagination": {
    "hasNext": true,
    "hasPrevious": false,
    "nextOffset": 10,
    "totalPages": 16
  }
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/user-history/user_12345?limit=5&status=sent"
```

---

### `GET /api/notifications/history-stats`
**Descripción:** Obtener estadísticas del historial de notificaciones

#### **Parámetros de Query (opcionales):**
- `startDate` (string): Fecha inicio
- `endDate` (string): Fecha fin
- `userId` (string): Filtrar por usuario específico

#### **Entrada:**
```
URL: /api/notifications/history-stats?startDate=2025-10-01&endDate=2025-10-29
```

#### **Respuesta Exitosa (200):**
```json
{
  "period": {
    "startDate": "2025-10-01T00:00:00.000Z",
    "endDate": "2025-10-29T23:59:59.000Z"
  },
  "totalProcessed": 5432,
  "deliveryStats": {
    "averageDeliveryTime": 2.4,
    "successRate": 96.2,
    "failureRate": 3.8
  },
  "channelPerformance": {
    "email": {
      "sent": 2344,
      "delivered": 2298,
      "failed": 46,
      "successRate": 98.0,
      "avgDeliveryTime": 1.8
    },
    "internal": {
      "sent": 1876,
      "delivered": 1876,
      "failed": 0,
      "successRate": 100.0,
      "avgDeliveryTime": 0.1
    },
    "push": {
      "sent": 987,
      "delivered": 923,
      "failed": 64,
      "successRate": 93.5,
      "avgDeliveryTime": 3.2
    },
    "sms": {
      "sent": 225,
      "delivered": 198,
      "failed": 27,
      "successRate": 88.0,
      "avgDeliveryTime": 5.1
    }
  },
  "topFailureReasons": [
    {
      "reason": "Invalid email address",
      "count": 23,
      "percentage": 34.3
    },
    {
      "reason": "SMS delivery timeout",
      "count": 18,
      "percentage": 26.9
    }
  ]
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/history-stats?startDate=2025-10-01"
```

---

## 9️⃣ **GESTIÓN DE ESTADO**

### `POST /api/notifications/retry-failed`
**Descripción:** Reintentar notificaciones fallidas

#### **Entrada (Body JSON):**
```json
{
  "notificationIds": ["notif_001", "notif_002"],
  "userId": "user_12345",
  "maxRetries": 3,
  "retryChannel": "email"
}
```

**Nota:** Todos los campos son opcionales. Sin parámetros reintenta todas las fallidas.

#### **Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Retry process initiated",
  "retryJob": {
    "id": "retry_job_001",
    "notificationsCount": 23,
    "estimatedTime": "2-3 minutes",
    "status": "processing"
  },
  "retryResults": {
    "scheduled": 23,
    "skipped": 2,
    "failed": 0
  }
}
```

#### **Comando de Prueba:**
```bash
curl -X POST "http://localhost:3000/api/notifications/retry-failed" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345",
    "maxRetries": 2
  }'
```

---

## 🔟 **TESTING Y HEALTH**

### `GET /api/notifications/health/email`
**Descripción:** Verificar estado del servicio de email

#### **Entrada:**
```
Ninguna
```

#### **Respuesta Exitosa (200):**
```json
{
  "service": "email",
  "status": "healthy",
  "lastCheck": "2025-10-29T21:30:00.000Z",
  "configuration": {
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "connected": true
    }
  },
  "stats": {
    "last24h": {
      "sent": 234,
      "failed": 5,
      "successRate": 97.9
    }
  }
}
```

#### **Respuesta Error (503):**
```json
{
  "service": "email",
  "status": "unhealthy",
  "error": "SMTP connection failed",
  "lastCheck": "2025-10-29T21:30:00.000Z"
}
```

#### **Comando de Prueba:**
```bash
curl -X GET "http://localhost:3000/api/notifications/health/email"
```

---

### `POST /api/notifications/test/email`
**Descripción:** Enviar email de prueba

#### **Entrada (Body JSON):**
```json
{
  "to": "test@ejemplo.com",
  "subject": "Test Email from Notifications API",
  "message": "Este es un email de prueba para verificar la funcionalidad"
}
```

#### **Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "emailId": "test_email_001",
  "sentAt": "2025-10-29T21:35:00.000Z",
  "deliveryTime": 1.8
}
```

#### **Comando de Prueba:**
```bash
curl -X POST "http://localhost:3000/api/notifications/test/email" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@ejemplo.com",
    "subject": "Prueba API",
    "message": "Email de prueba"
  }'
```

---

## 📋 **CÓDIGOS DE ERROR COMUNES**

### **400 - Bad Request**
```json
{
  "statusCode": 400,
  "message": ["Field validation failed", "userId should not be empty"],
  "error": "Bad Request"
}
```

### **404 - Not Found**
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### **500 - Internal Server Error**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### **503 - Service Unavailable**
```json
{
  "statusCode": 503,
  "message": "Kafka service unavailable",
  "error": "Service Unavailable"
}
```

---

## 🧪 **SCRIPT DE PRUEBA COMPLETO**

```bash
#!/bin/bash
# Script para probar todos los endpoints

BASE_URL="http://localhost:3000/api"

echo "=== TESTING NOTIFICATIONS API ==="

echo "1. Health Check"
curl -s -X GET "$BASE_URL/health" | jq '.'

echo -e "\n2. API Info"
curl -s -X GET "$BASE_URL" | jq '.'

echo -e "\n3. Get User Preferences"
curl -s -X GET "$BASE_URL/notifications/user/user_12345/preferences" | jq '.'

echo -e "\n4. Get Templates"
curl -s -X GET "$BASE_URL/notifications/templates" | jq '.'

echo -e "\n5. Get Channels"
curl -s -X GET "$BASE_URL/notifications/channels" | jq '.'

echo -e "\n6. Get Internal Notifications"
curl -s -X GET "$BASE_URL/notifications/user/user_12345/internal" | jq '.'

echo -e "\n7. Get User Stats"
curl -s -X GET "$BASE_URL/notifications/user/user_12345/stats" | jq '.'

echo -e "\n8. Get General Stats"
curl -s -X GET "$BASE_URL/notifications/stats" | jq '.'

echo -e "\nTesting completed!"
```

---

## 📝 **NOTAS PARA EL FRONTEND**

1. **Autenticación**: Los endpoints de notificaciones NO requieren autenticación en esta documentación, pero en producción deberían incluir JWT tokens.

2. **Paginación**: Endpoints que retornan listas soportan `limit` y `offset` para paginación.

3. **Fechas**: Todas las fechas están en formato ISO 8601 UTC.

4. **IDs de Usuario**: Usar el formato `user_12345` para las pruebas.

5. **Real-time**: Para notificaciones en tiempo real, considerar implementar WebSockets o Server-Sent Events.

6. **Error Handling**: Manejar todos los códigos de error HTTP apropiadamente.

7. **Loading States**: Los endpoints pueden tomar 1-3 segundos en responder, mostrar loading states.

8. **Validación**: El frontend debe validar datos antes de enviar para evitar errores 400.

---

**✅ Documento generado el 29 de Octubre 2025**
**📋 Todos los endpoints probados y documentados**
**🚀 Listo para integración con Frontend**