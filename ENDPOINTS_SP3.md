# 📡 ENDPOINTS API - SPRINT 3
## Microservicio de Notificaciones TITEC

**Base URL:** `http://localhost:3000/api/notifications`

---

## 📨 GESTIÓN DE NOTIFICACIONES

### 1. Crear Notificación
**`POST /create`**

Crea una nueva notificación en el sistema.

**Entrada:**
```json
{
  "id_emisor": 1,
  "id_receptor": 123,
  "id_plantilla": 1,
  "channel_ids": [1, 3]
}
```

**Salida:**
```json
{
  "id_notificacion": 45,
  "fecha_hora": "2025-11-05T01:30:00.000Z",
  "id_emisor": 1,
  "id_receptor": 123,
  "id_plantilla": 1,
  "channel_ids": [1, 3],
  "estado": "pendiente"
}
```

---

### 2. Crear Notificación de Prueba
**`POST /test-create`**

Crea una notificación de prueba con estructura simplificada.

**Entrada:**
```json
{
  "id_emisor": "orders-service",
  "id_receptor": "user-uuid-123",
  "id_plantilla": 1,
  "channel_ids": [1, 3]
}
```

**Salida:**
```json
{
  "id_notificacion": 46,
  "fecha_hora": "2025-11-05T01:30:00.000Z",
  "id_emisor": "orders-service",
  "id_receptor": "user-uuid-123",
  "id_plantilla": 1,
  "channel_ids": [1, 3],
  "estado": "pendiente"
}
```

---

### 3. Reintentar Notificaciones Fallidas
**`POST /retry-failed`**

Reintenta enviar todas las notificaciones con estado "fallido".

**Entrada:** Sin parámetros

**Salida:**
```json
{
  "message": "Failed notifications retry initiated"
}
```

---

## 👤 CONSULTAS POR USUARIO

### 4. Obtener Notificaciones de Usuario
**`GET /user/:userId`**

Obtiene las notificaciones de un usuario específico con información de la plantilla base.

**Parámetros:**
- `userId` (path): ID del usuario
- `page` (query, opcional): Número de página (default: 1)
- `limit` (query, opcional): Elementos por página (default: 20)

**Ejemplo:** `GET /user/123?page=1&limit=10`

**Salida:**
```json
[
  {
    "id_notificacion": 45,
    "fecha_hora": "2025-11-05T01:30:00.000Z",
    "id_emisor": 1,
    "id_receptor": 123,
    "id_plantilla": 1,
    "channel_ids": [1, 3],
    "estado": "leido",
    "plantilla": {
      "asunto_base": "Confirmación de Pedido",
      "descripcion_base": "Tu pedido #{{orden_id}} ha sido confirmado y está siendo procesado."
    }
  }
]
```

---

### 5. Historial de Notificaciones de Usuario
**`GET /user-history/:userId`**

Obtiene el historial completo de notificaciones de un usuario.

**Parámetros:**
- `userId` (path): ID del usuario (string)
- `page` (query, opcional): Número de página (default: 1)  
- `limit` (query, opcional): Elementos por página (default: 20)

**Ejemplo:** `GET /user-history/user-uuid-123?page=1&limit=15`

**Salida:**
```json
{
  "notifications": [
    {
      "id_notificacion": 46,
      "fecha_hora": "2025-11-05T01:30:00.000Z",
      "id_emisor": "orders-service",
      "id_receptor": "user-uuid-123",
      "id_plantilla": 1,
      "estado": "recibido",
      "channels_used": ["email", "push"]
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 15,
    "hasNextPage": true
  }
}
```

---

## 📊 ESTADÍSTICAS

### 6. Estadísticas Básicas
**`GET /stats`**

Obtiene estadísticas generales del sistema de notificaciones.

**Entrada:** Sin parámetros

**Salida:**
```json
{
  "total": 150,
  "pendientes": 12,
  "enviados": 85,
  "fallidos": 3,
  "recibidos": 35,
  "leidos": 15,
  "byStatus": {
    "pendiente": 12,
    "enviado": 85,
    "fallido": 3,
    "recibido": 35,
    "leido": 15
  },
  "byChannel": {
    "email": 120,
    "sms": 15,
    "push": 90
  },
  "timestamp": "2025-11-05T01:30:00.000Z"
}
```

---

### 7. Estadísticas del Historial
**`GET /history-stats`**

Obtiene estadísticas detalladas del historial de notificaciones.

**Entrada:** Sin parámetros

**Salida:**
```json
{
  "totalNotifications": 150,
  "statusDistribution": {
    "pendiente": 12,
    "enviado": 85,
    "recibido": 35,
    "leido": 15,
    "fallido": 3
  },
  "channelUsage": {
    "email": 120,
    "sms": 15,
    "push": 90
  },
  "templateUsage": {
    "1": 45,
    "2": 30,
    "5": 25
  }
}
```

---

## 📖 GESTIÓN DE ESTADO DE NOTIFICACIONES

### 8. Marcar Notificación como Leída
**`POST /notificacion_leida/:notificationId`**

Marca una notificación específica como leída.

**Parámetros:**
- `notificationId` (path): ID de la notificación (ObjectId de MongoDB)

**Ejemplo:** `POST /notificacion_leida/64a7b8c9e1234567890abcde`

**Salida:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

**Salida de Error:**
```json
{
  "success": false,
  "message": "Notificación no encontrada"
}
```

---

### 9. Marcar Múltiples Notificaciones como Leídas
**`POST /notificaciones_leidas`**

Marca múltiples notificaciones como leídas en una sola operación.

**Entrada:**
```json
{
  "notificationIds": [
    "64a7b8c9e1234567890abcde",
    "64a7b8c9e1234567890abcdf",
    "64a7b8c9e1234567890abce0"
  ]
}
```

**Salida:**
```json
{
  "success": true,
  "message": "3 notificaciones marcadas como leídas",
  "updated": 3
}
```

**Salida de Error:**
```json
{
  "success": false,
  "message": "Se requiere un array de IDs de notificaciones",
  "updated": 0
}
```

---

## ⚙️ CONFIGURACIÓN

### 10. Obtener Plantillas
**`GET /templates`**

Lista todas las plantillas de notificación disponibles.

**Entrada:** Sin parámetros

**Salida:**
```json
[
  {
    "id_Plantilla": 1,
    "tipo_Plantilla": 1,
    "asunto_base": "Tu orden fue creada",
    "descripción_base": "Tu orden {numero_orden} por ${monto} ha sido creada exitosamente"
  },
  {
    "id_Plantilla": 2,
    "tipo_Plantilla": 2,
    "asunto_base": "Tienes una nueva venta",
    "descripción_base": "Se ha creado una nueva orden {numero_orden} por ${monto}"
  },
  {
    "id_Plantilla": 5,
    "tipo_Plantilla": 3,
    "asunto_base": "Pedido cancelado",
    "descripción_base": "Tu pedido {numero_orden} ha sido cancelado. Razón: {razon_cancelacion}"
  }
]
```

---

### 11. Obtener Canales
**`GET /channels`**

Lista todos los canales de notificación disponibles.

**Entrada:** Sin parámetros

**Salida:**
```json
[
  {
    "id_canal": 1,
    "tipo_canal": "email",
    "nombre_canal": "Correo Electrónico",
    "activo": true
  },
  {
    "id_canal": 2,
    "tipo_canal": "sms",
    "nombre_canal": "Mensaje de Texto",
    "activo": true
  },
  {
    "id_canal": 3,
    "tipo_canal": "push",
    "nombre_canal": "Notificación Push",
    "activo": true
  }
]
```

---

### 12. Obtener Tipos de Plantilla
**`GET /template-types`**

Lista todos los tipos de plantillas disponibles.

**Entrada:** Sin parámetros

**Salida:**
```json
[
  {
    "id_tipo_plantilla": 1,
    "nombre_tipo": "order_created",
    "descripcion": "Plantilla para orden creada"
  },
  {
    "id_tipo_plantilla": 2,
    "nombre_tipo": "new_sale",
    "descripcion": "Plantilla para nueva venta"
  },
  {
    "id_tipo_plantilla": 3,
    "nombre_tipo": "order_cancelled",
    "descripcion": "Plantilla para pedido cancelado"
  }
]
```

---

## 🎧 MONITOREO

### 13. Estado del Listener
**`GET /listener-status`**

Obtiene el estado de los Change Streams y estadísticas del sistema.

**Entrada:** Sin parámetros

**Salida:**
```json
{
  "changeStreams": {
    "ordersStreamActive": true,
    "paymentsStreamActive": true,
    "connected": true,
    "timestamp": "2025-11-05T01:30:00.000Z"
  },
  "notifications": {
    "total": 150,
    "pendientes": 12,
    "enviados": 85,
    "fallidos": 3,
    "byStatus": {
      "pendiente": 12,
      "enviado": 85,
      "fallido": 3
    },
    "byChannel": {
      "email": 120,
      "sms": 15,
      "push": 90
    },
    "timestamp": "2025-11-05T01:30:00.000Z"
  },
  "integration": {
    "active": true,
    "message": "🎧 Escuchando eventos en tiempo real"
  }
}
```

---

## 🔧 TESTING

### 14. Verificar Estado del Email
**`GET /health/email`**

Verifica el estado del servicio de email.

**Entrada:** Sin parámetros

**Salida:**
```json
{
  "service": "email",
  "status": "healthy",
  "timestamp": "2025-11-05T01:30:00.000Z"
}
```

---

### 15. Enviar Email de Prueba
**`POST /test/email`**

Envía un email de prueba al destinatario especificado.

**Entrada:**
```json
{
  "to": "test@example.com",
  "subject": "Email de Prueba",
  "content": "<h1>Este es un email de prueba</h1>"
}
```

**Salida:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

## 📝 NOTAS TÉCNICAS

### Estados de Notificación:
- `pendiente`: Notificación creada, esperando procesamiento
- `enviado`: Notificación enviada exitosamente
- `recibido`: Notificación recibida por el usuario
- `leido`: Notificación leída por el usuario  
- `fallido`: Error en el envío de la notificación

### Canales Disponibles:
- **Canal 1**: Email (correo electrónico)
- **Canal 2**: SMS (mensaje de texto)
- **Canal 3**: Push (notificación push)

### Plantillas Implementadas:
- **Template 1**: Orden creada (comprador)
- **Template 2**: Nueva venta (vendedor)
- **Template 5**: Pedido cancelado (ambos)
- **Template 6**: Pago confirmado (vendedor)
- **Template 7**: Problema con pago (comprador)

---

## 🚀 INTEGRACIÓN CON CHANGE STREAMS

El sistema utiliza **MongoDB Change Streams** para detectar eventos en tiempo real desde otras bases de datos:

- **Órdenes**: Detecta creación y cancelación de pedidos
- **Pagos**: Detecta confirmaciones y rechazos de pagos
- **Automático**: Las notificaciones se crean automáticamente al detectar eventos
- **Estados Progresivos**: Las notificaciones evolucionan automáticamente entre estados

Este sistema permite funcionar **independientemente** de otros microservicios y es fácilmente escalable a Kafka en producción.