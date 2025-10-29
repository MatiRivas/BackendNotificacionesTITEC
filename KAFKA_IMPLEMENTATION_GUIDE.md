# 🚀 TITEC - Microservicio de Notificaciones con Kafka

## 📋 **Implementación Completada**

Este microservicio implementa las **4 Historias de Usuario (HDU1-4)** usando **Apache Kafka** como cola de mensajes para capturar eventos de otros microservicios y generar notificaciones automáticas.

### **✅ Historias de Usuario Implementadas**

- **HDU1**: Vendedor recibe notificación cuando comprador realiza compra
- **HDU2**: Vendedor recibe notificación cuando pedido cambia de estado  
- **HDU3**: Comprador recibe notificación confirmando su compra
- **HDU4**: Comprador recibe notificación cuando producto es enviado

## 🏗️ **Arquitectura Event-Driven**

```
Microservicio Compras    →  Kafka Topic: orders.created
Microservicio Pagos      →  Kafka Topic: payments.confirmed  
Microservicio Envíos     →  Kafka Topic: orders.shipped
Microservicio Estados    →  Kafka Topic: orders.status_changed
                            ↓
                        Kafka Consumers
                            ↓
                    Microservicio Notificaciones
                            ↓
                   Email | SMS | Push | WhatsApp
```

## 📁 **Estructura del Proyecto**

```
src/
├── kafka/                          # Módulo principal de Kafka
│   ├── kafka.service.ts            # Servicio base de Kafka
│   ├── kafka.module.ts             # Módulo de Kafka
│   ├── consumers/                  # Consumers por dominio
│   │   ├── order.consumer.ts       # Eventos de órdenes
│   │   ├── payment.consumer.ts     # Eventos de pagos
│   │   └── shipping.consumer.ts    # Eventos de envíos
│   └── dto/                        # DTOs para eventos
│       ├── order-event.dto.ts      # Eventos de órdenes
│       ├── payment-event.dto.ts    # Eventos de pagos
│       └── shipping-event.dto.ts   # Eventos de envíos
├── notificaciones/                 # Módulo de notificaciones
│   ├── notifications.service.ts    # Servicio principal
│   ├── notifications.controller.ts # API endpoints
│   ├── channels/                   # Canales de notificación
│   │   ├── email.service.ts        # Servicio de email
│   │   ├── sms.service.ts          # Servicio de SMS
│   │   └── push.service.ts         # Servicio de push
│   └── schemas/                    # Esquemas de BD
│       ├── notification.schema.ts  # Schema original
│       └── notification-history.schema.ts # Historial completo
├── config/
│   └── kafka.config.ts             # Configuración de Kafka
└── scripts/                        # Scripts de verificación
    ├── verify-system.ts            # Verificar sistema completo
    └── simulate-events.ts          # Simular eventos de prueba
```

## 🚀 **Configuración y Uso**

### **1. Variables de Entorno**

Configura tu archivo `.env`:

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/notificaciones

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notifications-service
KAFKA_GROUP_ID=notifications-group

# Email (configurar para testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### **2. Iniciar el Sistema**

```bash
# Instalar dependencias
npm install

# Compilar
npm run build

# Iniciar en desarrollo
npm run start:dev
```

### **3. Verificar el Sistema**

```bash
# Verificar que todo funciona
npm run verify:system

# Simular eventos de otros microservicios
npm run simulate:events
```

## 🔍 **Endpoints de Verificación**

### **Health Checks**
- `GET /notifications/health/email` - Estado del servicio de email
- `GET /notifications/stats` - Estadísticas de notificaciones

### **Gestión de Notificaciones**
- `GET /notifications/user/:userId` - Notificaciones de un usuario
- `POST /notifications/retry-failed` - Reintentar notificaciones fallidas
- `POST /notifications/test/email` - Enviar email de prueba

### **Ejemplo de Uso**

```bash
# Verificar estado del email
curl http://localhost:3000/notifications/health/email

# Ver estadísticas
curl http://localhost:3000/notifications/stats

# Ver notificaciones de un usuario
curl http://localhost:3000/notifications/user/seller-456
```

## 📊 **Topics de Kafka Monitoreados**

| Topic | Eventos | HDU |
|-------|---------|-----|
| `orders.created` | Nueva orden creada | HDU1, HDU3 |
| `orders.status_changed` | Estado de orden cambia | HDU2, HDU4 |
| `payments.confirmed` | Pago confirmado | - |
| `orders.shipped` | Orden enviada | HDU4 |

## 🧪 **Testing y Verificación**

### **1. Verificación Automática**
```bash
npm run verify:system
```

Esto verifica:
- ✅ Conexión a MongoDB
- ✅ Conexión a Kafka
- ✅ Servicios de notificación
- ✅ Procesamiento de eventos

### **2. Simulación de Eventos**
```bash
npm run simulate:events
```

Esto simula eventos de otros microservicios para probar el flujo completo.

### **3. Logs en Tiempo Real**

Los logs muestran cada paso del procesamiento:

```
[INFO] Kafka Consumer conectado al topic 'orders.created'
[INFO] Processing order created event: ORD-123456
[INFO] Notification sent successfully: not_abc123
[INFO] Successfully processed order created event: ORD-123456
```

## 🔧 **Resolución de Problemas**

### **Kafka no conecta**
1. Asegúrate que Kafka esté ejecutándose en `localhost:9092`
2. Verifica los topics existan:
   ```bash
   kafka-topics.sh --list --bootstrap-server localhost:9092
   ```

### **Email no se envía**
1. Configura credenciales SMTP válidas en `.env`
2. Para Gmail, usa "App Passwords"
3. Verifica con: `curl -X POST http://localhost:3000/notifications/test/email`

### **Base de datos**
1. Asegúrate MongoDB esté ejecutándose
2. Verifica la URI en `.env`

## 📈 **Métricas y Monitoreo**

El sistema registra métricas detalladas:

- **Total de notificaciones enviadas**
- **Tasa de éxito por canal**
- **Tiempo de procesamiento de eventos**
- **Fallos y reintentos**

Accede a las métricas:
```bash
curl http://localhost:3000/notifications/stats
```

## 🔮 **Próximos Pasos**

- [ ] Implementar SMS con Twilio
- [ ] Agregar push notifications con Firebase
- [ ] Crear dashboard de métricas
- [ ] Implementar tests automatizados
- [ ] Agregar más plantillas de notificación

## 🎉 **¡Sistema Listo!**

El microservicio de notificaciones está completamente implementado y listo para capturar eventos de otros microservicios a través de Kafka y generar notificaciones automáticas según las historias de usuario definidas.
