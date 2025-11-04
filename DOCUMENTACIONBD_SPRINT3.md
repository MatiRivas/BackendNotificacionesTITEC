# 📦 Documentación BD - Microservicio de Notificaciones

**Responsables BD:** Matías Rivas - Carlos Gaete  
**Backend:** Vicente Miralles  
**Base de Datos:** `Notificaciones` (MongoDB)

---

## 📊 Catálogos Disponibles

### Tipos de Canales
| id_canal | tipo_canal |
|----------|------------|
| 1 | email |
| 2 | SMS |
| 3 | push |

### Tipos de Plantillas
| id_tipo_plantilla | tipo_plantilla |
|-------------------|----------------|
| 1 | Transaccional |
| 2 | Promocional |
| 3 | Sistema |
| 4 | Recordatorio |

---

## 🎯 Mapeo de Plantillas

| ID | Asunto | Uso | Tipo | Variables | Canales |
|----|--------|-----|------|-----------|---------|
| 1 | Nueva venta realizada | Vendedor recibe notif. compra | Transaccional | {comprador}, {producto} | [1] |
| 2 | Compra confirmada | Comprador confirma compra | Transaccional | {producto}, {orden} | [1, 2] |
| 3 | Actualización de pedido | Cambio de estado | Sistema | {orden}, {estado} | [1] |
| 4 | Pedido enviado | Comprador notif. envío | Sistema | {orden}, {vendedor} | [1, 2] |
| 5 | Pedido cancelado | Vendedor notif. cancelación | Transaccional | {orden}, {usuario} | [1] |
| 6 | Problema de pago | Comprador notif. problema pago | Transaccional | {orden}, {tipo_problema}, {monto} | [1, 2] |
| 7 | Pago confirmado | Comprador notif. pago exitoso | Transaccional | {orden}, {monto} | [1, 2] |
| 8 | Pago rechazado | Comprador notif. pago rechazado | Transaccional | {orden}, {monto}, {razon} | [1, 2] |
| 9 | Pago recibido | Vendedor notif. pago recibido | Transaccional | {orden}, {monto}, {comprador} | [1] |
| 10 | Venta cancelada por el vendedor | Comprador notif. cancelación vendedor | Transaccional | {orden}, {link_soporte} | [1, 2, 3] |
| 11 | Compra cancelada por el comprador | Vendedor notif. cancelación comprador | Transaccional | {orden}, {motivo_cancelacion}, {estado_pedido} | [1, 2, 3] |

---

## 🔄 Estados de Notificación

| Estado | Descripción |
|--------|-------------|
| pendiente | Creada, esperando envío |
| enviado | Enviada exitosamente |
| recibido | Usuario la recibió |
| leido | Usuario la abrió |
| fallido | Error al enviar |

---

## 📝 Estructura de Notificación

```json
{
  "id_notificacion": 1,
  "fecha_hora": "2024-10-04T16:30:00.000Z",
  "id_emisor": "user-abc-123",
  "id_receptor": "user-def-456", 
  "id_plantilla": 1,
  "channel_ids": [1, 2],
  "estado": "pendiente",
  "metadata": {
    "monto": 15000,
    "tipo_problema": "rechazado",
    "accion_requerida": "reintentar_pago",
    "motivo_cancelacion": "Sin stock",
    "link_soporte": "https://ayuda.tienda.com",
    "orden_id": "ORD-12345",
    "estado_pedido": "preparando"
  }
}
```

### 📋 Campos Metadata por Tipo de Notificación

**Pagos (Plantillas 6-9):**
- `monto`: Monto de la transacción
- `tipo_problema`: "rechazado", "reembolso", "disputa"
- `accion_requerida`: "reintentar_pago", "subir_evidencia", "contactar_soporte"

**Cancelaciones (Plantillas 10-11):**
- `motivo_cancelacion`: Razón de la cancelación
- `link_soporte`: URL al centro de ayuda
- `orden_id`: ID de la orden afectada *(proviene del microservicio de Órdenes)*
- `estado_pedido`: "pendiente", "preparando", "listo para envío" *(proviene del microservicio de Órdenes)*

**Otros:**
- Campo extensible `[key: string]: any` para futuras HDU
