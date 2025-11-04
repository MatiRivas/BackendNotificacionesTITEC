# 🚀 TITEC - Microservicio de Notificaciones (v2.0)

## 📋 **Arquitectura de Microservicios**

Este proyecto ha sido migrado a una **arquitectura de microservicios pura**, donde este servicio se enfoca únicamente en **notificaciones**.

### **🔄 Cambios Principales de la Migración**

| **Antes (v1.0)** | **Después (v2.0)** |
|-------------------|---------------------|
| Monolito con Users + Auth | Microservicio puro de Notificaciones |
| id_emisor/id_receptor: Number | id_emisor/id_receptor: String (UUID) |
| Preferencias de usuario locales | Sin preferencias (canales fijos) |
| Tabla intermedia para canales | Array embebido `channel_ids` |
| UsersService local | UsersApiService (HTTP calls) |

---

## 🏗️ **Estructura del Proyecto**

```
src/
├── external/              # 🆕 Servicios externos
│   ├── users-api.service.ts   # Comunicación con microservicio Users
│   └── external.module.ts     # Módulo de servicios externos
├── kafka/                 # Eventos de otros microservicios
│   ├── consumers/         # Consumers de eventos
│   └── dto/               # DTOs de eventos
├── notificaciones/        # Core del microservicio
│   ├── channels/          # Servicios de canales (Email, SMS, Push)
│   ├── schemas/           # Esquemas de MongoDB
│   └── services/          # Servicios de negocio
└── config/                # Configuraciones
```

---

## 📊 **Base de Datos (MongoDB)**

### **Colecciones Principales:**

#### **📄 notificaciones**
```javascript
{
  "id_notificacion": 1,
  "fecha_hora": "2024-11-03T10:30:00Z",
  "id_emisor": "user_uuid_100",      // 🆕 String UUID
  "id_receptor": "user_uuid_200",    // 🆕 String UUID
  "id_plantilla": 5,
  "channel_ids": [1, 2],             // 🆕 Array embebido
  "estado": "pendiente",
  "receptor_cache": {                // 🆕 Cache de datos del usuario
    "email": "user@example.com",
    "telefono": "+56912345678",
    "nombre": "Juan Pérez",
    "ultimo_sync": "2024-11-03T10:00:00Z"
  }
}
```

#### **📄 plantillas**
```javascript
{
  "id_Plantilla": 1,
  "id_tipo_plantilla": 1,
  "descripción_base": "Nueva venta: {{producto}}",
  "asunto_base": "Venta confirmada",
  "canales_default": [1, 2],        // 🆕 Canales fijos por plantilla
  "activa": true
}
```

---

## 🔗 **Comunicación entre Microservicios**

### **📨 Eventos Kafka (Entrada)**
- `orders.created` → Crea notificación al vendedor
- `orders.shipped` → Notifica al comprador
- `payments.confirmed` → Notifica pago exitoso
- `payments.rejected` → Notifica problema de pago

### **🌐 HTTP Calls (Consultas)**
- `GET /users/{userId}` → Obtiene datos básicos del usuario
- `POST /users/batch` → Obtiene múltiples usuarios

---

## ⚙️ **Configuración**

### **Variables de Entorno (.env)**
```env
# Base de datos
MONGODB_URI=mongodb+srv://...

# Servicios externos
USERS_SERVICE_URL=http://microservicio-users:3001
USERS_SERVICE_TIMEOUT=5000

# Canales por defecto
DEFAULT_NOTIFICATION_CHANNELS=1,2  # Email + SMS
```

### **Mapeo de Canales por Tipo**
```typescript
const CHANNEL_MAPPING = {
  ORDER_CREATED: [1],        // Solo Email
  ORDER_SHIPPED: [1, 3],     // Email + Push
  PAYMENT_CONFIRMED: [1, 2], // Email + SMS (crítico)
  PAYMENT_REJECTED: [1, 2],  // Email + SMS (crítico)
  PAYMENT_ISSUE: [1, 2]      // Email + SMS (crítico)
};
```

---

## 🚀 **Instalación y Ejecución**

### **1. Instalar dependencias**
```bash
npm install
```

### **2. Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### **3. Migrar datos iniciales**
```bash
npx ts-node scripts/seed-templates-migration.ts
```

### **4. Ejecutar el servicio**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### **5. Kafka (opcional para desarrollo)**
```bash
docker-compose up kafka zookeeper kafka-ui
```

---

## 📋 **APIs Disponibles**

### **🔍 Estado del servicio**
```http
GET /
```

### **📨 Notificaciones**
```http
GET /api/notifications/user/:userId
GET /api/notifications/stats
POST /api/notifications/retry-failed
GET /api/notifications/health/email
POST /api/notifications/test/email
```

---

## ✅ **Historias de Usuario Soportadas**

### **✅ Sprint 1**
- [x] **HDU1**: Vendedor recibe notificación de compra
- [x] **HDU2**: Vendedor recibe notificación de cambio de estado
- [x] **HDU3**: Comprador recibe confirmación de compra
- [x] **HDU4**: Comprador recibe notificación de envío

### **✅ Sprint 2**
- [x] **HDU5**: Notificaciones de pago confirmado/rechazado
- [x] **HDU6**: Notificaciones de seguimiento de pedido
- [x] **HDU7**: Notificaciones de problemas de pago
- [x] **HDU8**: Canales configurables y fallback

---

## 🎯 **Ventajas de la Nueva Arquitectura**

### **✅ Beneficios**
- **Desacoplamiento**: Sin dependencias directas de otros microservicios
- **Performance**: Una sola responsabilidad, más eficiente
- **Escalabilidad**: Puede escalar independientemente
- **Mantenibilidad**: Código más limpio y enfocado
- **Flexibilidad**: Fácil agregar nuevos canales

### **📊 Comparación de Performance**
| **Operación** | **Antes** | **Después** |
|---------------|-----------|-------------|
| Crear notificación | 3 queries locales | 1 query + 1 HTTP call opcional |
| Consultar preferencias | 1 query local | N/A (canales fijos) |
| Enviar notificación | 2 queries locales | 1 query + cache |

---

## 🔧 **Desarrollo**

### **🧪 Testing**
```bash
npm run test
npm run test:e2e
npm run test:cov
```

### **📝 Linting**
```bash
npm run lint
npm run format
```

### **📚 Documentación**
- **Swagger**: http://localhost:3000/api
- **Kafka UI**: http://localhost:8080

---

## 🚨 **Consideraciones Importantes**

### **⚠️ Dependencias Externas**
- **Microservicio Users**: Debe estar disponible para obtener datos de usuario
- **Kafka**: Requerido para recibir eventos de otros microservicios

### **🔄 Manejo de Errores**
- Si Users no está disponible: Las notificaciones se crean pero no se envían
- Si hay datos cacheados: Se usan los datos del cache
- Reintentos automáticos configurables

### **🕒 Cache TTL**
- Datos de usuario se cachean por 1 hora
- Se sincronizan automáticamente en cada envío

---

## 📞 **Soporte**

Para dudas o problemas:
1. Revisar logs de la aplicación
2. Verificar conectividad con servicios externos
3. Consultar documentación de Kafka
4. Revisar estado de MongoDB Atlas

---

**Versión**: 2.0.0  
**Última actualización**: Noviembre 2024  
**Arquitectura**: Microservicios  
**Stack**: NestJS + MongoDB + Kafka + TypeScript