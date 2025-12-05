# 📘 Guía de Integración Completa - Sistema de Notificaciones con Kafka

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración de Kafka](#configuración-de-kafka)
4. [Microservicios y sus Eventos](#microservicios-y-sus-eventos)
5. [Ejemplos de Implementación por Microservicio](#ejemplos-de-implementación-por-microservicio)
6. [Tabla de Referencia Rápida](#tabla-de-referencia-rápida)
7. [Testing y Validación](#testing-y-validación)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Este documento describe cómo integrar el sistema de notificaciones con los diferentes microservicios de la plataforma TITEC utilizando Apache Kafka como sistema de mensajería.

### ¿Qué es Kafka?

Apache Kafka es una plataforma de streaming distribuido que permite:
- **Publicar y suscribirse** a flujos de eventos
- **Almacenar** flujos de eventos de forma duradera
- **Procesar** flujos de eventos en tiempo real

### ¿Por qué Kafka?

- ✅ **Desacoplamiento**: Los microservicios no necesitan conocerse entre sí
- ✅ **Escalabilidad**: Maneja millones de eventos por segundo
- ✅ **Confiabilidad**: Los eventos se persisten y pueden ser reprocesados
- ✅ **Tiempo real**: Notificaciones instantáneas a los usuarios

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Microservicio │      │   Microservicio │      │   Microservicio │
│     Órdenes     │      │     Pagos       │      │    Mensajería   │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │ Publica evento         │ Publica evento         │ Publica evento
         ▼                        ▼                        ▼
    ┌────────────────────────────────────────────────────────┐
    │                   Apache Kafka                          │
    │  Topics: orders.*, payments.*, messages.*, products.*  │
    └────────────────────┬───────────────────────────────────┘
                         │
                         │ Consume eventos
                         ▼
              ┌──────────────────────┐
              │   Microservicio      │
              │   Notificaciones     │
              │                      │
              │  - Procesa eventos   │
              │  - Crea notificación │
              │  - Envía email/push  │
              └──────────────────────┘
```

### Flujo de Eventos

1. **Microservicio origen** detecta un evento importante (nueva orden, pago confirmado, etc.)
2. **Publica** el evento a un topic específico de Kafka
3. **Servicio de Notificaciones** consume el evento
4. **Procesa** el evento y determina plantilla según rol del usuario
5. **Crea** la notificación en base de datos
6. **Envía** la notificación por los canales configurados (email, push)

---

## ⚙️ Configuración de Kafka

### Variables de Entorno

Cada microservicio debe configurar estas variables en su `.env`. A continuación se muestran ejemplos específicos para cada microservicio:

#### 🛒 Microservicio de Órdenes

```env
# Conexión a Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=orders-service
KAFKA_GROUP_ID=orders-group

# Configuración de conexión
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_INITIAL_RETRY_TIME=100
KAFKA_RETRIES=8

# Topics que publica
KAFKA_TOPIC_ORDERS_CREATED=orders.created
KAFKA_TOPIC_ORDERS_STATUS=orders.status_changed
KAFKA_TOPIC_ORDERS_SHIPPED=orders.shipped
```

#### 💳 Microservicio de Pagos

```env
# Conexión a Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=payments-service
KAFKA_GROUP_ID=payments-group

# Configuración de conexión
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_INITIAL_RETRY_TIME=100
KAFKA_RETRIES=8

# Topics que publica
KAFKA_TOPIC_PAYMENTS_CONFIRMED=payments.confirmed
KAFKA_TOPIC_PAYMENTS_REJECTED=payments.rejected
KAFKA_TOPIC_PAYMENTS_ISSUES=payments.issues
```

#### ✉️ Microservicio de Mensajería

```env
# Conexión a Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=messages-service
KAFKA_GROUP_ID=messages-group

# Configuración de conexión
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_INITIAL_RETRY_TIME=100
KAFKA_RETRIES=8

# Topics que publica
KAFKA_TOPIC_MESSAGES_RECEIVED=messages.received
```

#### 📦 Microservicio de Productos

```env
# Conexión a Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=products-service
KAFKA_GROUP_ID=products-group

# Configuración de conexión
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_INITIAL_RETRY_TIME=100
KAFKA_RETRIES=8

# Topics que publica
KAFKA_TOPIC_PRODUCTS_EDITED=products.edited
```


**Notas importantes:**
- **KAFKA_BROKERS**: Dirección del servidor Kafka (misma para todos)
- **KAFKA_CLIENT_ID**: Identificador único del microservicio
- **KAFKA_GROUP_ID**: Grupo de consumidores (mismo para instancias del mismo servicio)
- **Topics**: Cada microservicio solo declara los topics que usa

### Instalación de Dependencias

Todos los microservicios de la plataforma TITEC están desarrollados en **NestJS**. Instala las siguientes dependencias:

```bash
npm install kafkajs
npm install @nestjs/microservices
```

---

## 📦 Microservicios y sus Eventos

### 🛒 1. Microservicio de Órdenes

**Responsabilidad**: Gestionar el ciclo de vida de pedidos/órdenes

**Topics que publica**:
- `orders.created` - Cuando se crea una nueva orden
- `orders.status_changed` - Cuando cambia el estado de una orden
- `orders.shipped` - Cuando se despacha un pedido
- `orders.cancelled` - Cuando se cancela una orden

---

### 💳 2. Microservicio de Pagos

**Responsabilidad**: Procesar pagos y transacciones

**Topics que publica**:
- `payments.confirmed` - Cuando un pago es exitoso
- `payments.rejected` - Cuando un pago es rechazado
- `payments.issues` - Cuando hay problemas con un pago

---

### ✉️ 3. Microservicio de Mensajería

**Responsabilidad**: Gestionar conversaciones entre compradores y vendedores

**Topics que publica**:
- `messages.received` - Cuando se recibe un nuevo mensaje

---

### 📦 4. Microservicio de Productos

**Responsabilidad**: Gestionar catálogo de productos

**Topics que publica**:
- `products.edited` - Cuando se edita un producto

---

### 🚚 5. Microservicio de Envíos

**Responsabilidad**: Gestionar tracking y logística

**Topics que publica**:
- `shipping.updates` - Actualizaciones de envío (incluido en orders.shipped)

---

## 💻 Ejemplos de Implementación por Microservicio

---

## 🛒 MICROSERVICIO DE ÓRDENES

### Event 1: Nueva Orden Creada

**Topic**: `orders.created`

**¿Qué hace?**: Notifica al vendedor que tiene una nueva venta y al comprador que su compra fue registrada.

**¿Quién recibe?**: Vendedor (Plantilla 1) y Comprador (Plantilla 2)

**Datos requeridos**:
```typescript
{
  orderId: string;           // ID único de la orden
  buyerId: string;           // ID del comprador
  buyerName: string;         // Nombre del comprador
  buyerEmail: string;        // Email del comprador
  sellerId: string;          // ID del vendedor
  sellerName: string;        // Nombre del vendedor
  sellerEmail: string;       // Email del vendedor
  productName: string;       // Nombre del producto principal
  productId: string;         // ID del producto
  totalAmount: number;       // Monto total en pesos chilenos
  products: Array<{          // Lista de productos (opcional)
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;         // Timestamp ISO 8601
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: Crea o modifica el archivo del servicio donde se gestiona la creación de órdenes (típicamente `src/orders/orders.service.ts`).

```typescript
import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('KAFKA_CLIENT') 
    private kafkaClient: ClientKafka
  ) {}

  async createOrder(orderData: CreateOrderDto) {
    // 1. Crear la orden en tu base de datos
    const order = await this.orderRepository.save(orderData);

    // 2. Publicar evento a Kafka
    await this.kafkaClient.emit('orders.created', {
      orderId: order.id,
      buyerId: order.buyerId,
      buyerName: order.buyer.name,
      buyerEmail: order.buyer.email,
      sellerId: order.sellerId,
      sellerName: order.seller.name,
      sellerEmail: order.seller.email,
      productName: order.items[0].productName,
      productId: order.items[0].productId,
      totalAmount: order.total,
      products: order.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      createdAt: new Date().toISOString()
    });

    return order;
  }
}
```

**Configuración del módulo**: En tu `orders.module.ts`, registra el cliente de Kafka:

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'orders-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

---

### Event 2: Cambio de Estado de Orden

**Topic**: `orders.status_changed`

**¿Qué hace?**: Notifica cambios en el estado de la orden (confirmado, en preparación, enviado, etc.). Caso especial: "Listo para despacho" notifica al vendedor.

**¿Quién recibe?**: Comprador (Plantilla 3) y/o Vendedor (Plantilla 10, 12)

**Datos requeridos**:
```typescript
{
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerAddress?: string;      // REQUERIDO si newStatus = "Listo para despacho"
  buyerPhone?: string;         // REQUERIDO si newStatus = "Listo para despacho"
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  productName: string;
  productId: string;
  totalAmount: number;
  oldStatus: string;           // Estado anterior
  newStatus: string;           // Estado nuevo (ej: "confirmado", "Listo para despacho")
  orderDate: string;
  changedAt: string;           // Timestamp del cambio
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de órdenes (`src/orders/orders.service.ts`), agrega o modifica el método que actualiza el estado de una orden:

```typescript
async updateOrderStatus(orderId: string, newStatus: string) {
  const order = await this.orderRepository.findById(orderId);
  const oldStatus = order.status;
  
  // Actualizar estado en BD
  order.status = newStatus;
  await this.orderRepository.save(order);
  
  // Publicar evento
  const eventData: any = {
    orderId: order.id,
    buyerId: order.buyerId,
    buyerName: order.buyer.name,
    buyerEmail: order.buyer.email,
    sellerId: order.sellerId,
    sellerName: order.seller.name,
    sellerEmail: order.seller.email,
    productName: order.items[0].productName,
    productId: order.items[0].productId,
    totalAmount: order.total,
    oldStatus: oldStatus,
    newStatus: newStatus,
    orderDate: order.createdAt.toISOString(),
    changedAt: new Date().toISOString()
  };
  
  // Si el estado es "Listo para despacho", agregar datos de entrega
  if (newStatus === 'Listo para despacho' || 
      newStatus === 'listo_para_despacho' || 
      newStatus === 'ready_to_ship') {
    eventData.buyerAddress = order.shippingAddress;
    eventData.buyerPhone = order.buyer.phone;
  }
  
  await this.kafkaClient.emit('orders.status_changed', eventData);
  
  return order;
}
```

---

### Event 3: Orden Enviada

**Topic**: `orders.shipped`

**¿Qué hace?**: Notifica al comprador que su pedido fue despachado con información de tracking.

**¿Quién recibe?**: Comprador (Plantilla 4)

**Datos requeridos**:
```typescript
{
  orderId: string;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  productName: string;
  trackingNumber: string;      // Número de seguimiento
  carrier: string;             // Empresa de envío (ej: "Chilexpress")
  estimatedDelivery: string;   // Fecha estimada de entrega (ISO 8601)
  shippedAt: string;           // Fecha de envío (ISO 8601)
  totalAmount: number;
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de órdenes (`src/orders/orders.service.ts`), agrega el método que maneja el despacho de órdenes:

```typescript
async shipOrder(orderId: string, shippingData: ShippingDto) {
  const order = await this.orderRepository.findById(orderId);
  
  // Actualizar orden con datos de envío
  order.status = 'shipped';
  order.trackingNumber = shippingData.trackingNumber;
  order.carrier = shippingData.carrier;
  await this.orderRepository.save(order);
  
  // Publicar evento
  await this.kafkaClient.emit('orders.shipped', {
    orderId: order.id,
    buyerId: order.buyerId,
    buyerEmail: order.buyer.email,
    sellerId: order.sellerId,
    sellerName: order.seller.name,
    productName: order.items[0].productName,
    trackingNumber: shippingData.trackingNumber,
    carrier: shippingData.carrier,
    estimatedDelivery: shippingData.estimatedDelivery.toISOString(),
    shippedAt: new Date().toISOString(),
    totalAmount: order.total
  });
  
  return order;
}
```

---

### Event 4: Orden Cancelada

**Topic**: `orders.cancelled` (o usar `orders.status_changed` con status="cancelled")

**¿Qué hace?**: Notifica la cancelación de una orden, ya sea por el comprador o vendedor.

**¿Quién recibe?**: Comprador (Plantilla 5, 10) y/o Vendedor (Plantilla 11)

**Datos requeridos**:
```typescript
{
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  productName: string;
  totalAmount: number;
  cancellationReason: string;  // Motivo de cancelación
  cancelledBy: 'buyer' | 'seller';  // Quién canceló
  cancelledAt: string;
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de órdenes (`src/orders/orders.service.ts`), agrega el método que maneja la cancelación de órdenes:

```typescript
async cancelOrder(orderId: string, reason: string, cancelledBy: 'buyer' | 'seller') {
  const order = await this.orderRepository.findById(orderId);
  
  order.status = 'cancelled';
  order.cancellationReason = reason;
  await this.orderRepository.save(order);
  
  await this.kafkaClient.emit('orders.status_changed', {
    orderId: order.id,
    buyerId: order.buyerId,
    buyerName: order.buyer.name,
    buyerEmail: order.buyer.email,
    sellerId: order.sellerId,
    sellerName: order.seller.name,
    sellerEmail: order.seller.email,
    productName: order.items[0].productName,
    totalAmount: order.total,
    oldStatus: order.previousStatus,
    newStatus: 'cancelled',
    cancellationReason: reason,
    estadoPedido: 'Cancelado',
    changedAt: new Date().toISOString()
  });
  
  return order;
}
```

---

## 💳 MICROSERVICIO DE PAGOS

### Event 5: Pago Confirmado

**Topic**: `payments.confirmed`

**¿Qué hace?**: Notifica que un pago fue procesado exitosamente.

**¿Quién recibe?**: Comprador (Plantilla 7) y Vendedor (Plantilla 9)

**Datos requeridos**:
```typescript
{
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  productName: string;
  totalAmount: number;
  paymentMethod: string;       // "Tarjeta de crédito", "Transferencia", etc.
  transactionId?: string;      // ID de transacción (opcional)
  confirmedAt: string;         // Timestamp ISO 8601
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de pagos (`src/payments/payments.service.ts`), agrega o modifica el método que confirma pagos:

```typescript
async confirmPayment(paymentData: PaymentDto) {
  // 1. Procesar pago
  const payment = await this.paymentGateway.processPayment(paymentData);
  
  // 2. Guardar en BD
  await this.paymentRepository.save(payment);
  
  // 3. Publicar evento
  const order = await this.orderService.findById(payment.orderId);
  
  await this.kafkaClient.emit('payments.confirmed', {
    orderId: order.id,
    buyerId: order.buyerId,
    buyerName: order.buyer.name,
    buyerEmail: order.buyer.email,
    sellerId: order.sellerId,
    sellerEmail: order.seller.email,
    productName: order.items[0].productName,
    totalAmount: payment.amount,
    paymentMethod: payment.method,
    transactionId: payment.transactionId,
    confirmedAt: new Date().toISOString()
  });
  
  return payment;
}
```

**Configuración del módulo**: En tu `payments.module.ts`, registra el cliente de Kafka (similar a como se hizo en OrdersModule):

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'payments-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  // ... resto de la configuración
})
export class PaymentsModule {}
```

---

### Event 6: Pago Rechazado

**Topic**: `payments.rejected`

**¿Qué hace?**: Notifica que un pago fue rechazado.

**¿Quién recibe?**: Comprador (Plantilla 8)

**Datos requeridos**:
```typescript
{
  orderId: string;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  productName: string;
  totalAmount: number;
  paymentMethod: string;
  rejectionReason: string;     // "Fondos insuficientes", "Tarjeta inválida", etc.
  paymentOutcome: 'rejected';  // Siempre 'rejected'
  attemptedAt: string;
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de pagos (`src/payments/payments.service.ts`), agrega el método que maneja rechazos de pago:

```typescript
async handlePaymentRejection(paymentData: PaymentDto, reason: string) {
  const order = await this.orderService.findById(paymentData.orderId);
  
  // Guardar intento fallido
  await this.paymentRepository.saveFailedAttempt({
    orderId: order.id,
    reason: reason,
    attemptedAt: new Date()
  });
  
  // Publicar evento
  await this.kafkaClient.emit('payments.rejected', {
    orderId: order.id,
    buyerId: order.buyerId,
    buyerEmail: order.buyer.email,
    sellerId: order.sellerId,
    productName: order.items[0].productName,
    totalAmount: paymentData.amount,
    paymentMethod: paymentData.method,
    rejectionReason: reason,
    paymentOutcome: 'rejected',
    attemptedAt: new Date().toISOString()
  });
}
```

---

### Event 7: Problema con Pago

**Topic**: `payments.issues`

**¿Qué hace?**: Notifica problemas generales con pagos (no necesariamente rechazo).

**¿Quién recibe?**: Vendedor (Plantilla 6) si afecta la venta

**Datos requeridos**:
```typescript
{
  orderId: string;
  buyerId: string;
  sellerId: string;
  productName: string;
  totalAmount: number;
  issueType: string;           // "rechazado", "pendiente", "en_revision"
  rejectionReason?: string;    // Detalles del problema
  reportedAt: string;
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de pagos (`src/payments/payments.service.ts`), agrega el método que reporta problemas de pago:

```typescript
async reportPaymentIssue(orderId: string, issueType: string, details: string) {
  const order = await this.orderService.findById(orderId);
  
  await this.kafkaClient.emit('payments.issues', {
    orderId: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    productName: order.items[0].productName,
    totalAmount: order.total,
    issueType: issueType,
    rejectionReason: details,
    reportedAt: new Date().toISOString()
  });
}
```

---

## ✉️ MICROSERVICIO DE MENSAJERÍA

### Event 8: Nuevo Mensaje Recibido

**Topic**: `messages.received`

**¿Qué hace?**: Notifica cuando un usuario recibe un mensaje en una conversación.

**¿Quién recibe?**: El receptor del mensaje (Plantilla 13) - puede ser comprador o vendedor

**Datos requeridos**:
```typescript
{
  messageId: string;
  conversationId: string;
  senderId: string;            // ID del que envía
  senderName: string;          // Nombre del que envía
  senderRole: 'buyer' | 'seller';
  receiverId: string;          // ID del que recibe
  receiverRole: 'buyer' | 'seller';
  messageContent: string;      // Contenido completo del mensaje
  messagePreview: string;      // Primeros 50-100 caracteres
  productId?: string;          // Producto sobre el que conversan (opcional)
  productName?: string;
  orderId?: string;            // Orden relacionada (opcional)
  receivedAt: string;          // Timestamp ISO 8601
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de mensajería (`src/messages/messages.service.ts` o `src/chat/chat.service.ts`), agrega el método que envía mensajes:

```typescript
async sendMessage(messageData: CreateMessageDto) {
  // 1. Guardar mensaje en BD
  const message = await this.messageRepository.save({
    conversationId: messageData.conversationId,
    senderId: messageData.senderId,
    content: messageData.content,
    createdAt: new Date()
  });
  
  // 2. Obtener datos de la conversación
  const conversation = await this.conversationRepository.findById(
    messageData.conversationId
  );
  
  // 3. Determinar receptor
  const receiverId = conversation.participants.find(
    id => id !== messageData.senderId
  );
  
  const sender = await this.userService.findById(messageData.senderId);
  const receiver = await this.userService.findById(receiverId);
  
  // 4. Publicar evento
  await this.kafkaClient.emit('messages.received', {
    messageId: message.id,
    conversationId: conversation.id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role, // 'buyer' o 'seller'
    receiverId: receiver.id,
    receiverRole: receiver.role,
    messageContent: messageData.content,
    messagePreview: messageData.content.substring(0, 50),
    productId: conversation.productId,
    productName: conversation.productName,
    orderId: conversation.orderId,
    receivedAt: new Date().toISOString()
  });
  
  return message;
}
```

**Configuración del módulo**: En tu `messages.module.ts`, registra el cliente de Kafka:

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'messages-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  // ... resto de la configuración
})
export class MessagesModule {}
```

---

## 📦 MICROSERVICIO DE PRODUCTOS

### Event 9: Producto Editado

**Topic**: `products.edited`

**¿Qué hace?**: Confirma al vendedor que su producto fue editado exitosamente.

**¿Quién recibe?**: Vendedor (Plantilla 14)

**Datos requeridos**:
```typescript
{
  productId: string;
  productName: string;
  sellerId: string;
  sellerEmail: string;
  changedFields: string[];     // ["price", "stock", "description"]
  oldPrice?: number;           // Si cambió el precio
  newPrice?: number;
  oldStock?: number;           // Si cambió el stock
  newStock?: number;
  oldDescription?: string;     // Si cambió la descripción
  newDescription?: string;
  editedAt: string;            // Timestamp ISO 8601
  editedBy: string;            // ID del usuario que editó
}
```

**Ejemplo de Implementación en NestJS**:

**Ubicación**: En tu archivo de servicio de productos (`src/products/products.service.ts`), agrega o modifica el método que actualiza productos:

```typescript
async updateProduct(productId: string, updates: UpdateProductDto, userId: string) {
  // 1. Obtener producto actual
  const product = await this.productRepository.findById(productId);
  
  // 2. Detectar qué campos cambiaron
  const changedFields: string[] = [];
  const eventData: any = {
    productId: product.id,
    productName: product.name,
    sellerId: product.sellerId,
    sellerEmail: product.seller.email,
    editedAt: new Date().toISOString(),
    editedBy: userId
  };
  
  if (updates.price !== undefined && updates.price !== product.price) {
    changedFields.push('price');
    eventData.oldPrice = product.price;
    eventData.newPrice = updates.price;
  }
  
  if (updates.stock !== undefined && updates.stock !== product.stock) {
    changedFields.push('stock');
    eventData.oldStock = product.stock;
    eventData.newStock = updates.stock;
  }
  
  if (updates.description && updates.description !== product.description) {
    changedFields.push('description');
    eventData.oldDescription = product.description;
    eventData.newDescription = updates.description;
  }
  
  // 3. Actualizar producto
  Object.assign(product, updates);
  await this.productRepository.save(product);
  
  // 4. Solo publicar si hubo cambios
  if (changedFields.length > 0) {
    eventData.changedFields = changedFields;
    await this.kafkaClient.emit('products.edited', eventData);
  }
  
  return product;
}
```

**Configuración del módulo**: En tu `products.module.ts`, registra el cliente de Kafka:

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'products-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
        },
      },
    ]),
  ],
  // ... resto de la configuración
})
export class ProductsModule {}
```

---

## 📊 Tabla de Referencia Rápida

| # | Evento | Topic | Plantillas | Receptor | Microservicio Origen |
|---|--------|-------|------------|----------|---------------------|
| 1 | Nueva orden | `orders.created` | 1, 2 | Vendedor, Comprador | Órdenes |
| 2 | Estado de orden | `orders.status_changed` | 3, 10 | Comprador, Vendedor | Órdenes |
| 3 | Listo para despacho | `orders.status_changed` | 12 | Vendedor | Órdenes |
| 4 | Orden enviada | `orders.shipped` | 4 | Comprador | Órdenes |
| 5 | Orden cancelada | `orders.status_changed` | 5, 10, 11 | Ambos | Órdenes |
| 6 | Pago confirmado | `payments.confirmed` | 7, 9 | Comprador, Vendedor | Pagos |
| 7 | Pago rechazado | `payments.rejected` | 8 | Comprador | Pagos |
| 8 | Problema de pago | `payments.issues` | 6 | Vendedor | Pagos |
| 9 | Nuevo mensaje | `messages.received` | 13 | Receptor | Mensajería |
| 10 | Producto editado | `products.edited` | 14 | Vendedor | Productos |

---

## 🧪 Testing y Validación

### Herramientas de Testing

#### 1. Kafka Console Producer (Testing manual)
```bash
# Producir un evento de prueba
kafka-console-producer --broker-list localhost:9092 --topic orders.created

# Pegar este JSON:
{
  "orderId": "TEST-001",
  "buyerId": "buyer-123",
  "buyerName": "Juan Pérez",
  "buyerEmail": "juan@test.com",
  "sellerId": "seller-456",
  "sellerName": "Tienda Tech",
  "sellerEmail": "tienda@test.com",
  "productName": "Laptop Dell",
  "productId": "PROD-001",
  "totalAmount": 500000,
  "createdAt": "2025-11-29T10:00:00Z"
}
```

#### 2. Script de Pruebas Automatizado

El sistema incluye un script completo de pruebas:

```bash
# Probar todas las plantillas
npm run test:notifications

# Probar eventos del Sprint 4
npm run test:sprint4

# Probar evento específico
npm run test:sprint4 -- --event message
```

#### 3. Verificar Consumo de Eventos

```bash
# Ver eventos consumidos
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic orders.created \
  --from-beginning
```

### Validación de Datos

Cada evento debe cumplir con:

✅ **Campos requeridos presentes**
```typescript
// Ejemplo de validación en NestJS
import { IsString, IsNumber, IsEmail, IsISO8601 } from 'class-validator';

export class OrderCreatedEventDto {
  @IsString()
  orderId: string;
  
  @IsString()
  buyerId: string;
  
  @IsEmail()
  buyerEmail: string;
  
  @IsNumber()
  totalAmount: number;
  
  @IsISO8601()
  createdAt: string;
}
```

✅ **Timestamps en formato ISO 8601**
```typescript
// ✅ Correcto
createdAt: new Date().toISOString() // "2025-11-29T10:30:00.000Z"

// ❌ Incorrecto
createdAt: Date.now() // 1701257400000
createdAt: new Date() // Objeto Date
```

✅ **Montos en números (pesos chilenos sin decimales)**
```typescript
// ✅ Correcto
totalAmount: 45990

// ❌ Incorrecto
totalAmount: "45990"
totalAmount: 45990.50
```

✅ **Roles como strings específicos**
```typescript
// ✅ Correcto
senderRole: 'buyer'
receiverRole: 'seller'

// ❌ Incorrecto
senderRole: 'BUYER'
senderRole: 'customer'
```



## 📚 Recursos Adicionales

### Documentación Oficial

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS (Node.js)](https://kafka.js.org/)
- [Spring Kafka (Java)](https://spring.io/projects/spring-kafka)
- [kafka-python](https://kafka-python.readthedocs.io/)


### Contacto y Soporte

Para dudas o problemas:
1. Revisa los logs del servicio de notificaciones
2. Verifica que todos los campos requeridos estén presentes
3. Usa los scripts de testing incluidos
4. Consulta la documentación de troubleshooting

---

## ✅ Checklist de Integración

Usa este checklist para cada microservicio:

### Configuración Inicial
- [ ] Kafka instalado y configurado
- [ ] Dependencias instaladas (kafkajs, kafka-python, etc.)
- [ ] Variables de entorno configuradas
- [ ] Conexión a Kafka verificada

### Por Cada Evento
- [ ] Topic correcto identificado
- [ ] Todos los campos requeridos incluidos
- [ ] Timestamps en formato ISO 8601
- [ ] Roles correctamente especificados ('buyer' o 'seller')
- [ ] Montos en números enteros (CLP)
- [ ] Emails válidos
- [ ] Testing manual realizado
- [ ] Testing automatizado pasando

### Producción
- [ ] Manejo de errores implementado
- [ ] Logs de auditoría configurados
- [ ] Retry logic para fallos temporales
- [ ] Monitoring de eventos configurado
- [ ] Documentación actualizada

