# Sprint 4 - Nuevas Funcionalidades de Notificaciones

## 📋 Resumen

Se implementaron 3 nuevas HDUs (Historias de Usuario) para el Sprint 4, enfocadas en notificaciones para mensajería y gestión de productos.

## 🎯 HDUs Implementadas

### HDU2: Notificación de Pedido Listo para Despacho
**Actor:** Vendedor  
**Objetivo:** Recibir notificación cuando un pedido está listo para ser enviado

**Plantilla:** 12  
**Topic Kafka:** `orders.status_changed`  
**Trigger:** Estado del pedido = "Listo para despacho" / "listo_para_despacho" / "ready_to_ship"

**Metadata incluida:**
- `orderId`: ID del pedido
- `buyerName`: Nombre del comprador
- `buyerAddress`: Dirección de entrega
- `buyerPhone`: Teléfono del comprador
- `productName`: Nombre del producto
- `totalAmount`: Monto total formateado
- `actionUrl`: `/orders/{orderId}`

---

### HDU3: Notificación de Nuevo Mensaje
**Actor:** Comprador y Vendedor  
**Objetivo:** Recibir notificación cuando hay un nuevo mensaje en una conversación

**Plantilla:** 13  
**Topic Kafka:** `messages.received`  
**Trigger:** Evento `message_received` en Kafka

**Metadata incluida:**
- `messageId`: ID del mensaje
- `conversationId`: ID de la conversación
- `senderName`: Nombre del remitente
- `senderRole`: Rol del remitente (buyer/seller)
- `messagePreview`: Vista previa del mensaje (primeros 50 caracteres)
- `productName`: Producto relacionado (si aplica)
- `actionUrl`: `/messages/{conversationId}`

---

### HDU4: Confirmación de Edición de Producto
**Actor:** Vendedor  
**Objetivo:** Recibir confirmación cuando se edita un producto

**Plantilla:** 14  
**Topic Kafka:** `products.edited`  
**Trigger:** Evento `product_edited` en Kafka

**Metadata incluida:**
- `productId`: ID del producto
- `productName`: Nombre del producto
- `changedFields`: Array de campos modificados
- `oldPrice`: Precio anterior (si cambió)
- `newPrice`: Precio nuevo (si cambió)
- `oldStock`: Stock anterior (si cambió)
- `newStock`: Stock nuevo (si cambió)
- `actionUrl`: `/products/{productId}`

## 🗂️ Archivos Creados

### 1. DTOs (Data Transfer Objects)
```
src/kafka/dto/
├── message-event.dto.ts      # DTO para eventos de mensajes
└── product-event.dto.ts      # DTO para eventos de productos
```

### 2. Consumers (Consumidores Kafka)
```
src/kafka/consumers/
├── message.consumer.ts       # Consumer para messages.received
└── product.consumer.ts       # Consumer para products.edited
```

### 3. Scripts de Prueba
```
scripts/
└── test-sprint4-events.ts    # Script específico para probar Sprint 4
```

## 🔧 Archivos Modificados

### 1. `src/config/kafka.config.ts`
Agregados nuevos topics:
```typescript
messagesReceived: process.env.KAFKA_TOPIC_MESSAGES_RECEIVED || 'messages.received',
productsEdited: process.env.KAFKA_TOPIC_PRODUCTS_EDITED || 'products.edited',
```

### 2. `src/kafka/kafka.module.ts`
Registrados nuevos consumers:
```typescript
import { MessageConsumer } from './consumers/message.consumer';
import { ProductConsumer } from './consumers/product.consumer';

providers: [
  // ...
  MessageConsumer,
  ProductConsumer,
]
```

### 3. `src/kafka/consumers/order.consumer.ts`
Agregada lógica para detectar estado "Listo para despacho":
```typescript
if (statusEvent.newStatus === 'Listo para despacho' || 
    statusEvent.newStatus === 'listo_para_despacho' ||
    statusEvent.newStatus === 'ready_to_ship') {
  // Notificar al vendedor
}
```

### 4. `src/notificaciones/notifications.service.ts`
Actualizados los mapeos de eventos:

**Para vendedores:**
```typescript
'order_ready_to_ship': 12,
'message_received': 13,
'product_edited': 14,
```

**Para compradores:**
```typescript
'message_received': 13,
```

### 5. `package.json`
Agregado nuevo script de prueba:
```json
"test:sprint4": "ts-node scripts/test-sprint4-events.ts"
```

## 📊 Estructura de Eventos Kafka

### Evento: message_received
```json
{
  "messageId": "MSG-001",
  "conversationId": "CONV-456",
  "senderId": "user-123",
  "senderName": "Carlos Ramírez",
  "senderRole": "buyer",
  "receiverId": "seller-456",
  "receiverRole": "seller",
  "messageContent": "¿El producto tiene garantía?",
  "messagePreview": "¿El producto tiene garantía?",
  "productId": "PROD-IP-007",
  "productName": "iPhone 14 Pro",
  "orderId": "ORD-MSG-001",
  "receivedAt": "2025-01-27T10:30:00Z"
}
```

### Evento: product_edited
```json
{
  "productId": "PROD-EDIT-001",
  "productName": "Samsung Galaxy S23",
  "sellerId": "seller-456",
  "sellerEmail": "seller@test.com",
  "changedFields": ["price", "stock"],
  "oldPrice": 699990,
  "newPrice": 649990,
  "oldStock": 5,
  "newStock": 10,
  "editedAt": "2025-01-27T10:30:00Z",
  "editedBy": "seller-456"
}
```

### Evento: order_status_changed (ready to ship)
```json
{
  "orderId": "ORD-READY-001",
  "buyerId": "buyer-123",
  "buyerName": "María González",
  "buyerEmail": "buyer@test.com",
  "buyerAddress": "Av. Providencia 1234, Santiago",
  "buyerPhone": "+56912345678",
  "sellerId": "seller-456",
  "sellerEmail": "seller@test.com",
  "productId": "PROD-MAC-003",
  "productName": "MacBook Pro 13",
  "orderDate": "2025-01-20T10:30:00Z",
  "totalAmount": 1299990,
  "oldStatus": "preparing",
  "newStatus": "Listo para despacho",
  "changedAt": "2025-01-27T10:30:00Z"
}
```

## 🧪 Testing

### Ejecutar todas las pruebas del Sprint 4
```bash
npm run test:sprint4
```

### Probar un evento específico
```bash
# HDU2: Listo para despacho
npm run test:sprint4 -- --event ready

# HDU3: Mensajes
npm run test:sprint4 -- --event message

# HDU4: Productos editados
npm run test:sprint4 -- --event product
```

### Probar todos los escenarios de un HDU
```bash
npm run test:sprint4 -- --hdu 2    # Listo para despacho
npm run test:sprint4 -- --hdu 3    # Mensajes (2 escenarios)
npm run test:sprint4 -- --hdu 4    # Productos (3 escenarios)
```

### Ver ayuda
```bash
npm run test:sprint4 -- --help
```

## 📝 Plantillas Utilizadas

### Plantilla 12: Listo para Despacho (Vendedor)
```
Asunto: Pedido {orderId} listo para despacho
Descripción: El pedido de {comprador} está listo para ser enviado
Variables: {orderId}, {comprador}, {direccion}, {telefono}, {producto}
```

### Plantilla 13: Nuevo Mensaje (Buyer/Seller)
```
Asunto: Nuevo mensaje de {userName}
Descripción: {userName} te ha enviado un mensaje
Variables: {userName}, {mensaje}, {producto}
```

### Plantilla 14: Producto Editado (Vendedor)
```
Asunto: Producto {producto} editado exitosamente
Descripción: Se ha confirmado la edición de tu producto
Variables: {producto}, {campos}, {precioAnterior}, {precioNuevo}, {stockAnterior}, {stockNuevo}
```

## 🔗 Endpoints Relacionados

### Obtener notificaciones de usuario
```
GET /notificaciones/user/:userId
Query params: 
  - limit: número de notificaciones (default: 50)
  - offset: desplazamiento para paginación
  - unreadOnly: true/false (solo no leídas)
```

### Marcar notificación como leída
```
POST /notificaciones/notificacion_leida/:id
```

### Marcar múltiples como leídas
```
POST /notificaciones/notificaciones_leidas
Body: {
  "notificationIds": ["id1", "id2", "id3"]
}
```

## ✅ Validaciones Implementadas

### MessageReceivedEventDto
- `messageId`: requerido, string
- `conversationId`: requerido, string
- `senderId`: requerido, string
- `senderName`: requerido, string
- `senderRole`: requerido, enum ['buyer', 'seller']
- `receiverId`: requerido, string
- `receiverRole`: requerido, enum ['buyer', 'seller']
- `messageContent`: requerido, string
- `messagePreview`: opcional, string
- `receivedAt`: requerido, ISO date string

### ProductEditedEventDto
- `productId`: requerido, string
- `productName`: requerido, string
- `sellerId`: requerido, string
- `sellerEmail`: opcional, email
- `changedFields`: requerido, array de strings
- `oldPrice`, `newPrice`: opcionales, números
- `oldStock`, `newStock`: opcionales, números
- `editedAt`: requerido, ISO date string

## 🚀 Variables de Entorno

Agregar a `.env`:
```env
# Topics Sprint 4
KAFKA_TOPIC_MESSAGES_RECEIVED=messages.received
KAFKA_TOPIC_PRODUCTS_EDITED=products.edited
```

## 📚 Notas Importantes

1. **NO se implementó funcionalidad "no leído"** según especificación del Sprint 4
2. Los cambios de productos vienen desde Kafka, no desde modificación de plantillas
3. Las notificaciones de mensajes funcionan **bidireccionalmente** (buyer ↔ seller)
4. El estado "Listo para despacho" acepta 3 variantes: 
   - `Listo para despacho`
   - `listo_para_despacho`
   - `ready_to_ship`

## 🔄 Flujo de Procesamiento

### Mensajes
1. Servicio de mensajería produce evento `messages.received` en Kafka
2. `MessageConsumer` recibe el evento
3. Valida el DTO `MessageReceivedEventDto`
4. Determina el rol del receptor
5. Crea notificación con plantilla 13
6. Procesa variables del mensaje
7. Envía por canales configurados (email, push)

### Productos Editados
1. Servicio de productos produce evento `products.edited` en Kafka
2. `ProductConsumer` recibe el evento
3. Valida el DTO `ProductEditedEventDto`
4. Notifica al vendedor con plantilla 14
5. Incluye resumen de cambios en metadata
6. Envía confirmación por email y push

### Listo para Despacho
1. Servicio de órdenes actualiza estado a "Listo para despacho"
2. Produce evento `orders.status_changed` en Kafka
3. `OrderConsumer` detecta el nuevo estado
4. Notifica al vendedor con plantilla 12
5. Incluye datos del comprador para facilitar envío
6. Marca como alta prioridad

## 🎨 Ejemplo de Notificación Procesada

```json
{
  "_id": "678e1234567890abcdef",
  "userId": "seller-test-456",
  "title": "Nuevo mensaje de Carlos Ramírez",
  "message": "Carlos Ramírez te ha enviado un mensaje: '¿El producto tiene garantía?'",
  "type": "message_received",
  "channels": ["email", "push"],
  "priority": "high",
  "leida": false,
  "metadata": {
    "conversationId": "CONV-456",
    "messageId": "MSG-001",
    "senderName": "Carlos Ramírez",
    "senderRole": "buyer",
    "messagePreview": "¿El producto tiene garantía?",
    "productName": "iPhone 14 Pro",
    "actionUrl": "/messages/CONV-456"
  },
  "createdAt": "2025-01-27T10:30:00.000Z"
}
```

## 🐛 Troubleshooting

### El consumer no se registra
- Verificar que esté en `providers` de `kafka.module.ts`
- Verificar import correcto

### No se reciben eventos
- Verificar que Kafka esté corriendo
- Verificar topics en `.env`
- Ver logs del consumer: buscar "initialized and subscribed"

### Plantilla incorrecta
- Verificar mapeo en `mapEventToTemplateSeller/Buyer`
- Verificar que `eventType` coincida con el caso del mapping

### Variables no se reemplazan
- Verificar que las variables estén en `eventData`
- Verificar nombres exactos en plantilla: `{comprador}`, `{producto}`, etc.

---

**Fecha de implementación:** Enero 2025  
**Sprint:** 4  
**Versión:** 1.0.0
