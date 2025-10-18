# 📋 DOCUMENTACIÓN API - NUEVOS ENDPOINTS SPRINT 2

## 🎯 **RESUMEN**
Esta documentación cubre los **4 nuevos endpoints** implementados en el Sprint 2 para gestión de preferencias de notificación y notificaciones internas.

**Base URL:** `http://localhost:3000`

---

## 🔗 **ENDPOINTS IMPLEMENTADOS**

### 1️⃣ **GET** `/notifications/user/:userId/preferences`
**Descripción:** Obtiene las preferencias de notificación de un usuario específico.

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

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
  "lastUpdated": "2025-10-17T23:45:00.000Z"
}
```

#### **Ejemplo de Uso:**
```bash
curl -X GET "http://localhost:3000/notifications/user/user_12345/preferences" \
  -H "Content-Type: application/json"
```

---

### 2️⃣ **PUT** `/notifications/user/:userId/preferences`
**Descripción:** Actualiza las preferencias de notificación de un usuario.

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Body de Petición:**
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
  "lastUpdated": "2025-10-17T23:50:00.000Z"
}
```

#### **Ejemplo de Uso:**
```bash
curl -X PUT "http://localhost:3000/notifications/user/user_12345/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredChannels": ["email", "internal"],
    "enableNotifications": true,
    "notificationTypes": ["order", "payment"]
  }'
```

---

### 3️⃣ **GET** `/notifications/user/:userId/internal`
**Descripción:** Obtiene todas las notificaciones internas no leídas de un usuario.

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Respuesta Exitosa (200):**
```json
[
  {
    "_id": "671234567890abcdef123456",
    "userId": "user_12345",
    "title": "Pago rechazado",
    "content": "Tu pago para la orden #ORD-789 fue rechazado por fondos insuficientes.",
    "channel": "internal",
    "status": "sent",
    "isRead": false,
    "createdAt": "2025-10-17T23:30:00.000Z",
    "sentAt": "2025-10-17T23:30:05.000Z",
    "metadata": {
      "isInternalFallback": true,
      "originalChannel": "email",
      "rejectionReason": "insufficient_funds",
      "orderId": "ORD-789",
      "retryUrl": "/orders/ORD-789/payment"
    }
  },
  {
    "_id": "671234567890abcdef123457",
    "userId": "user_12345",
    "title": "Disputa abierta - Acción requerida",
    "content": "Se ha abierto una disputa para tu venta #ORD-456. Tienes 7 días para responder.",
    "channel": "internal",
    "status": "sent",
    "isRead": false,
    "createdAt": "2025-10-17T22:15:00.000Z",
    "sentAt": "2025-10-17T22:15:02.000Z",
    "metadata": {
      "isInternalFallback": false,
      "disputeId": "DISP-123",
      "evidenceUrl": "/seller/disputes/DISP-123/evidence",
      "responseDeadline": "2025-10-24T22:15:00.000Z",
      "urgentAction": true
    }
  }
]
```

#### **Respuesta Sin Notificaciones (200):**
```json
[]
```

#### **Ejemplo de Uso:**
```bash
curl -X GET "http://localhost:3000/notifications/user/user_12345/internal" \
  -H "Content-Type: application/json"
```

---

### 4️⃣ **PATCH** `/notifications/:id/read`
**Descripción:** Marca una notificación específica como leída.

#### **Parámetros de URL:**
- `id` (string, required): ID de la notificación

#### **Body de Petición:**
```json
{
  "userId": "user_12345",
  "readAt": "2025-10-17T23:55:00.000Z"
}
```

**Nota:** `readAt` es opcional. Si no se proporciona, se usa la fecha/hora actual.

#### **Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### **Respuesta Error - Notificación No Encontrada (200):**
```json
{
  "success": false,
  "message": "Notification not found or already read"
}
```

#### **Ejemplo de Uso:**
```bash
curl -X PATCH "http://localhost:3000/notifications/671234567890abcdef123456/read" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345"
  }'
```

---

## 🎁 **ENDPOINT BONUS**

### 5️⃣ **GET** `/notifications/user/:userId/stats`
**Descripción:** Obtiene estadísticas de notificaciones para un usuario.

#### **Parámetros de URL:**
- `userId` (string, required): ID único del usuario

#### **Respuesta Exitosa (200):**
```json
{
  "internal": {
    "total": 15,
    "unread": 3,
    "fallbackCount": 8
  },
  "preferences": {
    "enabledChannels": ["email", "internal"],
    "notificationsEnabled": true,
    "lastUpdated": "2025-10-17T23:45:00.000Z"
  }
}
```

#### **Ejemplo de Uso:**
```bash
curl -X GET "http://localhost:3000/notifications/user/user_12345/stats" \
  -H "Content-Type: application/json"
```

---

## 📊 **CÓDIGOS DE RESPUESTA**

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `400` | Datos de entrada inválidos |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## 🔧 **TIPOS DE CANALES DISPONIBLES**

| Canal | Descripción |
|-------|-------------|
| `email` | Notificaciones por correo electrónico |
| `sms` | Notificaciones por SMS |
| `push` | Notificaciones push en la aplicación móvil |
| `internal` | Notificaciones internas en la aplicación web |

---

## 📋 **TIPOS DE NOTIFICACIÓN DISPONIBLES**

| Tipo | Descripción |
|------|-------------|
| `order` | Notificaciones relacionadas con órdenes |
| `payment` | Notificaciones de pagos y problemas financieros |
| `shipping` | Notificaciones de envío y logística |
| `general` | Notificaciones generales del sistema |

---

## 🚀 **FLUJO DE USO TÍPICO**

### **Configuración Inicial:**
1. **GET** `/notifications/user/:userId/preferences` - Obtener preferencias actuales
2. **PUT** `/notifications/user/:userId/preferences` - Configurar canales preferidos

### **Consulta de Notificaciones:**
3. **GET** `/notifications/user/:userId/internal` - Ver notificaciones pendientes
4. **PATCH** `/notifications/:id/read` - Marcar como leídas

### **Monitoreo:**
5. **GET** `/notifications/user/:userId/stats` - Revisar estadísticas

---

## 🔄 **SISTEMA DE FALLBACK AUTOMÁTICO**

Cuando un canal de notificación falla, el sistema automáticamente:

1. **Reintenta** el canal original (máximo 2 veces)
2. **Cambia** al siguiente canal en las preferencias del usuario
3. **Registra** el intento en `metadata.fallbackHistory`
4. **Garantiza** que al menos llegue como notificación `internal`

**Orden por Defecto:** `email` → `push` → `sms` → `internal`

---

## 📝 **NOTAS IMPORTANTES**

- **Preferencias por Defecto:** Si un usuario no tiene preferencias configuradas, se crean automáticamente con `["email", "internal"]`
- **Notificaciones Internas:** Siempre están habilitadas como último recurso para el fallback
- **Latencia HDU6:** Las notificaciones de pagos rechazados tienen prioridad alta (máximo 5 segundos)
- **Limpieza Automática:** Las notificaciones internas leídas se eliminan después de 30 días

---

## 🧪 **EJEMPLOS DE TESTING**

### **Crear Preferencias Básicas:**
```bash
curl -X PUT "http://localhost:3000/notifications/user/test_user/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredChannels": ["email", "internal"],
    "enableNotifications": true,
    "notificationTypes": ["order", "payment"]
  }'
```

### **Desactivar Todas las Notificaciones:**
```bash
curl -X PUT "http://localhost:3000/notifications/user/test_user/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "enableNotifications": false,
    "preferredChannels": ["internal"]
  }'
```

### **Solo Notificaciones Urgentes:**
```bash
curl -X PUT "http://localhost:3000/notifications/user/test_user/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredChannels": ["sms", "internal"],
    "notificationTypes": ["payment"]
  }'
```

---

*Documentación generada para Sprint 2 - Sistema de Notificaciones*  
*Fecha: 17 de Octubre, 2025*