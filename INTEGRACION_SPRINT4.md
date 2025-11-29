# 🔄 Guía de Actualización Sprint 4

## Cambios para Otros Servicios

### 1️⃣ Servicio de Mensajería

Cuando se recibe un nuevo mensaje, publicar a Kafka:

```typescript
// Topic: messages.received
await kafkaProducer.send({
  topic: 'messages.received',
  messages: [{
    value: JSON.stringify({
      messageId: string,           // ID único del mensaje
      conversationId: string,      // ID de la conversación
      senderId: string,            // ID del usuario que envía
      senderName: string,          // Nombre del remitente
      senderRole: 'buyer' | 'seller', // Rol del remitente
      receiverId: string,          // ID del usuario que recibe
      receiverRole: 'buyer' | 'seller', // Rol del receptor
      messageContent: string,      // Contenido completo del mensaje
      messagePreview?: string,     // Vista previa (max 50 chars)
      productId?: string,          // ID del producto relacionado
      productName?: string,        // Nombre del producto
      orderId?: string,            // ID del pedido relacionado
      receivedAt: string,          // ISO 8601 timestamp
    })
  }]
});
```

**Ejemplo:**
```json
{
  "messageId": "msg-abc123",
  "conversationId": "conv-xyz789",
  "senderId": "buyer-001",
  "senderName": "Juan Pérez",
  "senderRole": "buyer",
  "receiverId": "seller-456",
  "receiverRole": "seller",
  "messageContent": "¿El producto tiene garantía?",
  "messagePreview": "¿El producto tiene garantía?",
  "productId": "prod-789",
  "productName": "iPhone 14 Pro",
  "receivedAt": "2025-01-27T15:30:00.000Z"
}
```

---

### 2️⃣ Servicio de Productos

Cuando se edita un producto, publicar a Kafka:

```typescript
// Topic: products.edited
await kafkaProducer.send({
  topic: 'products.edited',
  messages: [{
    value: JSON.stringify({
      productId: string,           // ID del producto editado
      productName: string,         // Nombre del producto
      sellerId: string,            // ID del vendedor
      sellerEmail?: string,        // Email del vendedor (opcional)
      changedFields: string[],     // Campos modificados: ['price', 'stock', 'description']
      oldPrice?: number,           // Precio anterior (si cambió)
      newPrice?: number,           // Precio nuevo (si cambió)
      oldStock?: number,           // Stock anterior (si cambió)
      newStock?: number,           // Stock nuevo (si cambió)
      oldDescription?: string,     // Descripción anterior (si cambió)
      newDescription?: string,     // Descripción nueva (si cambió)
      editedAt: string,            // ISO 8601 timestamp
      editedBy: string,            // ID del usuario que editó
    })
  }]
});
```

**Ejemplo - Solo precio:**
```json
{
  "productId": "prod-123",
  "productName": "Samsung Galaxy S23",
  "sellerId": "seller-456",
  "sellerEmail": "seller@test.com",
  "changedFields": ["price"],
  "oldPrice": 699990,
  "newPrice": 649990,
  "editedAt": "2025-01-27T15:30:00.000Z",
  "editedBy": "seller-456"
}
```

**Ejemplo - Múltiples campos:**
```json
{
  "productId": "prod-456",
  "productName": "MacBook Pro 13",
  "sellerId": "seller-789",
  "changedFields": ["price", "stock", "description"],
  "oldPrice": 1299990,
  "newPrice": 1199990,
  "oldStock": 5,
  "newStock": 10,
  "oldDescription": "Laptop profesional",
  "newDescription": "Laptop profesional con chip M2, 8GB RAM, 256GB SSD",
  "editedAt": "2025-01-27T15:30:00.000Z",
  "editedBy": "seller-789"
}
```

---

### 3️⃣ Servicio de Órdenes

Cuando un pedido está listo para despacho:

```typescript
// Topic: orders.status_changed (ya existente)
await kafkaProducer.send({
  topic: 'orders.status_changed',
  messages: [{
    value: JSON.stringify({
      orderId: string,
      buyerId: string,
      buyerName: string,
      buyerEmail: string,
      buyerAddress: string,        // 🆕 Necesario para HDU2
      buyerPhone: string,          // 🆕 Necesario para HDU2
      sellerId: string,
      sellerEmail: string,
      productId: string,
      productName: string,
      orderDate: string,
      totalAmount: number,
      oldStatus: string,
      newStatus: 'Listo para despacho', // 🔑 Estado clave
      changedAt: string,
    })
  }]
});
```

**Estados soportados para HDU2:**
- `Listo para despacho` ✅ (recomendado)
- `listo_para_despacho` ✅
- `ready_to_ship` ✅

**Ejemplo:**
```json
{
  "orderId": "ord-abc123",
  "buyerId": "buyer-001",
  "buyerName": "María González",
  "buyerEmail": "maria@example.com",
  "buyerAddress": "Av. Providencia 1234, Santiago",
  "buyerPhone": "+56912345678",
  "sellerId": "seller-456",
  "sellerEmail": "seller@example.com",
  "productId": "prod-789",
  "productName": "MacBook Pro 13",
  "orderDate": "2025-01-20T10:00:00.000Z",
  "totalAmount": 1299990,
  "oldStatus": "preparing",
  "newStatus": "Listo para despacho",
  "changedAt": "2025-01-27T15:30:00.000Z"
}
```

---

## 🔧 Configuración de Kafka

### Variables de Entorno

Agregar a `.env` de cada servicio:

```env
# Kafka Brokers
KAFKA_BROKERS=localhost:9092

# Topics Sprint 4
KAFKA_TOPIC_MESSAGES_RECEIVED=messages.received
KAFKA_TOPIC_PRODUCTS_EDITED=products.edited

# Topics existentes
KAFKA_TOPIC_ORDERS_STATUS=orders.status_changed
```

### Conexión a Kafka (ejemplo NestJS)

```typescript
import { ClientKafka } from '@nestjs/microservices';

constructor(
  @Inject('KAFKA_CLIENT') 
  private kafkaClient: ClientKafka
) {}

async publishMessage(data: any) {
  await this.kafkaClient.emit('messages.received', data);
}
```

---

## ✅ Checklist de Integración

### Servicio de Mensajería
- [ ] Implementar publicación a `messages.received`
- [ ] Incluir `senderRole` y `receiverRole`
- [ ] Generar `messagePreview` (max 50 caracteres)
- [ ] Timestamp en formato ISO 8601
- [ ] Probar con usuario buyer → seller
- [ ] Probar con usuario seller → buyer

### Servicio de Productos
- [ ] Implementar publicación a `products.edited`
- [ ] Detectar qué campos cambiaron
- [ ] Incluir valores `old` y `new` para cambios
- [ ] Timestamp en formato ISO 8601
- [ ] Probar edición de precio
- [ ] Probar edición de stock
- [ ] Probar edición múltiple

### Servicio de Órdenes
- [ ] Usar estado "Listo para despacho" (exacto)
- [ ] Incluir `buyerAddress` en evento
- [ ] Incluir `buyerPhone` en evento
- [ ] Timestamp en formato ISO 8601
- [ ] Probar transición a ready_to_ship

---

## 🧪 Testing de Integración

### 1. Test Manual - Mensajes

```bash
# En terminal 1: Servicio de notificaciones
npm run start:dev

# En terminal 2: Publicar evento de prueba
kafka-console-producer --broker-list localhost:9092 --topic messages.received

# Enviar:
{
  "messageId": "test-msg-001",
  "conversationId": "test-conv-001",
  "senderId": "buyer-001",
  "senderName": "Test User",
  "senderRole": "buyer",
  "receiverId": "seller-001",
  "receiverRole": "seller",
  "messageContent": "Test message",
  "receivedAt": "2025-01-27T15:30:00.000Z"
}
```

### 2. Test Manual - Productos

```bash
kafka-console-producer --broker-list localhost:9092 --topic products.edited

# Enviar:
{
  "productId": "test-prod-001",
  "productName": "Test Product",
  "sellerId": "seller-001",
  "changedFields": ["price"],
  "oldPrice": 10000,
  "newPrice": 9000,
  "editedAt": "2025-01-27T15:30:00.000Z",
  "editedBy": "seller-001"
}
```

### 3. Verificar Notificaciones

```bash
# Ver notificaciones del vendedor
curl http://localhost:3000/notificaciones/user/seller-001

# Ver notificaciones del comprador
curl http://localhost:3000/notificaciones/user/buyer-001
```

---

## 📊 Monitoreo de Notificaciones

### Endpoints Útiles

```bash
# Ver notificaciones de un usuario
GET /notificaciones/user/:userId?limit=10

# Ver solo no leídas
GET /notificaciones/user/:userId?unreadOnly=true

# Marcar como leída
POST /notificaciones/notificacion_leida/:notificationId

# Marcar múltiples como leídas
POST /notificaciones/notificaciones_leidas
Body: { "notificationIds": ["id1", "id2"] }
```

### Logs de Consumers

El servicio de notificaciones mostrará en consola:

```
[MessageConsumer] Processing message received event: MSG-001
[MessageConsumer] Message notification sent for conversation: CONV-456

[ProductConsumer] Processing product edited event: PROD-123
[ProductConsumer] Product edit notification sent: PROD-123

[OrderConsumer] Order ready to ship notification sent for order: ORD-456
```

---

## 🚨 Errores Comunes

### Error: "Invalid event data"
**Causa:** DTO no pasa validación  
**Solución:** Verificar que todos los campos requeridos estén presentes

```typescript
// ❌ Incorrecto - falta receiverRole
{
  "messageId": "msg-001",
  "senderId": "buyer-001"
  // ...falta receiverRole
}

// ✅ Correcto
{
  "messageId": "msg-001",
  "senderId": "buyer-001",
  "receiverRole": "seller"  // ✓
}
```

### Error: "No se envió notificación"
**Causa:** Topic incorrecto o consumer no registrado  
**Solución:** Verificar:
1. Topic name en `.env`
2. Consumer en `kafka.module.ts`
3. Kafka corriendo

### Error: "Variables no reemplazadas"
**Causa:** Nombres de campos no coinciden  
**Solución:** Usar nombres exactos del schema:

```typescript
// En eventData usar:
{
  "buyerName": "Juan",     // ✓ Correcto
  "comprador": "Juan"      // ✗ No funciona
}
```

---

## 📝 Resumen de Campos Requeridos

### messages.received
- ✅ `messageId`
- ✅ `conversationId`
- ✅ `senderId`
- ✅ `senderName`
- ✅ `senderRole`
- ✅ `receiverId`
- ✅ `receiverRole`
- ✅ `messageContent`
- ✅ `receivedAt`

### products.edited
- ✅ `productId`
- ✅ `productName`
- ✅ `sellerId`
- ✅ `changedFields` (array)
- ✅ `editedAt`
- ⭕ `oldPrice`, `newPrice` (si cambió precio)
- ⭕ `oldStock`, `newStock` (si cambió stock)

### orders.status_changed (ready to ship)
- ✅ `orderId`
- ✅ `sellerId`
- ✅ `buyerName`
- ✅ `buyerAddress` 🆕
- ✅ `buyerPhone` 🆕
- ✅ `productName`
- ✅ `newStatus` = "Listo para despacho"

---

## 🔗 Recursos

- **Documentación completa:** `SPRINT4_IMPLEMENTATION.md`
- **Resumen ejecutivo:** `SPRINT4_RESUMEN.md`
- **Script de pruebas:** `scripts/test-sprint4-events.ts`
- **Ejemplos de eventos:** Ver carpeta `src/kafka/dto/`

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025
