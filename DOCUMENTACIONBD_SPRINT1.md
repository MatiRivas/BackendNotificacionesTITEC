# 📦 Documentación BD - Microservicio de Notificaciones

**Responsables BD:** Matías Rivas - Carlos Gaete  
**Backend:** Vicente Miralles  
**Base de Datos:** `Notificaciones` (MongoDB)

---

## 📊 Catálogos Disponibles

### Tipos de Canales
| id_canal | tipo_canal |
|----------|------------|
| 1 | in-app |
| 2 | email |

### Tipos de Plantillas
| id_tipo_plantilla | tipo_plantilla |
|-------------------|----------------|
| 1 | Transaccional |
| 2 | Confirmacion |
| 3 | Actualizacion_Estado |
| 4 | Promocional |
| 5 | Recordatorio |

---

## 🎯 Mapeo de Plantillas

| ID | Asunto | Uso | Tipo | Variables | Canales |
|----|--------|-----|------|-----------|---------|
| 1 | Nueva venta realizada | Vendedor recibe notif. compra | Confirmacion | {comprador}, {producto} | [1] |
| 2 | Compra confirmada | Comprador confirma compra | Confirmacion | {producto}, {orden} | [1, 2] |
| 3 | Actualización de pedido | Cambio de estado | Actualizacion | {orden}, {estado} | [1] |
| 4 | Pedido enviado | Comprador notif. envío | Actualizacion | {orden}, {vendedor} | [1, 2] |
| 5 | Pedido cancelado | Vendedor notif. cancelación | Transaccional | {orden}, {usuario} | [1] |

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
  "id_emisor": 100,
  "id_receptor": 200,
  "id_plantilla": 1,
  "channel_ids": [1, 2],
  "estado": "pendiente"
}
```