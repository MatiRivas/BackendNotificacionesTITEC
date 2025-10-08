/**
 * 🧪 DEMO PRÁCTICA: Probando Endpoints del Sistema
 * 
 * Esta demo muestra cómo interactuar con el sistema a través de su API
 */

console.log(`
🧪 ===== DEMO PRÁCTICA: Endpoints del Sistema =====

🚀 INICIANDO SERVIDOR...
Para usar esta demo:
1. Ejecuta: npm run start:dev
2. En otra terminal: npm run test:endpoints

📡 ENDPOINTS DISPONIBLES:
${'─'.repeat(60)}

🔍 HEALTH CHECKS:
GET /notifications/health/email
   ✓ Verifica conexión SMTP
   ✓ Respuesta: { "service": "email", "status": "healthy" }

📊 MÉTRICAS Y ESTADÍSTICAS:
GET /notifications/stats
   ✓ Total de notificaciones
   ✓ Estadísticas por estado
   ✓ Estadísticas por canal

👤 NOTIFICACIONES DE USUARIO:
GET /notifications/user/:userId?page=1&limit=20
   ✓ Lista notificaciones del usuario
   ✓ Paginación incluida
   
🧪 TESTING:
POST /notifications/test/email
   Body: {
     "to": "tu-email@ejemplo.com",
     "subject": "Test desde TITEC",
     "content": "<h1>Funciona!</h1>"
   }

🔄 GESTIÓN:
POST /notifications/retry-failed
   ✓ Reintenta notificaciones fallidas
`);

// Mostrar ejemplos de cURL para cada endpoint
const ejemplosCurl = [
  {
    nombre: 'Verificar estado del email',
    comando: 'curl -X GET http://localhost:3000/notifications/health/email',
    descripcion: 'Verifica si el servicio de email está funcionando'
  },
  {
    nombre: 'Ver estadísticas generales',
    comando: 'curl -X GET http://localhost:3000/notifications/stats',
    descripcion: 'Obtiene métricas del sistema de notificaciones'
  },
  {
    nombre: 'Ver notificaciones de un usuario',
    comando: 'curl -X GET "http://localhost:3000/notifications/user/buyer-123?page=1&limit=10"',
    descripcion: 'Lista las notificaciones del usuario buyer-123'
  },
  {
    nombre: 'Enviar email de prueba',
    comando: `curl -X POST http://localhost:3000/notifications/test/email \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "tu-email@ejemplo.com",
    "subject": "Prueba desde TITEC",
    "content": "<h1>¡El sistema funciona!</h1><p>Notificación enviada desde el microservicio TITEC.</p>"
  }'`,
    descripcion: 'Envía un email de prueba (requiere SMTP configurado)'
  },
  {
    nombre: 'Reintentar notificaciones fallidas',
    comando: 'curl -X POST http://localhost:3000/notifications/retry-failed',
    descripcion: 'Reintenta enviar notificaciones que fallaron previamente'
  }
];

console.log(`
📝 EJEMPLOS DE USO CON cURL:
${'─'.repeat(60)}`);

ejemplosCurl.forEach((ejemplo, index) => {
  console.log(`
${index + 1}. ${ejemplo.nombre}:
   ${ejemplo.descripcion}
   
   ${ejemplo.comando}
`);
});

console.log(`
🔄 FLUJO COMPLETO DE PRUEBA:
${'─'.repeat(60)}

1️⃣ INICIAR EL SERVIDOR:
   npm run start:dev

2️⃣ VERIFICAR SALUD DEL SISTEMA:
   curl http://localhost:3000/notifications/health/email

3️⃣ SIMULAR EVENTOS DE OTROS MICROSERVICIOS:
   # En otra terminal
   npm run simulate:events

4️⃣ VER RESULTADOS:
   curl http://localhost:3000/notifications/stats
   curl http://localhost:3000/notifications/user/buyer-123

🎯 EJEMPLO DE RESPUESTA REAL:
${'─'.repeat(60)}

GET /notifications/stats podría devolver:
{
  "byStatus": [
    { "_id": "sent", "count": 15 },
    { "_id": "pending", "count": 2 },
    { "_id": "failed", "count": 1 }
  ],
  "byChannel": [
    { "_id": "email", "count": 12 },
    { "_id": "push", "count": 6 }
  ],
  "total": 18
}

GET /notifications/user/buyer-123 podría devolver:
[
  {
    "id": "...",
    "eventType": "order_created",
    "subject": "Confirmación de compra - #ORD-123",
    "channel": "email",
    "status": "sent",
    "sentAt": "2025-10-05T23:20:00.000Z"
  },
  {
    "id": "...",
    "eventType": "order_shipped", 
    "subject": "¡Tu pedido fue enviado! - #ORD-123",
    "channel": "push",
    "status": "sent",
    "sentAt": "2025-10-05T23:25:00.000Z"
  }
]

🎉 SISTEMA COMPLETAMENTE FUNCIONAL!
   Todas las HDUs implementadas y testeables vía API.
`);

// Mostrar cómo simular un flujo completo
console.log(`
🎬 SIMULACIÓN DE FLUJO COMPLETO:
${'─'.repeat(60)}

ESCENARIO: María compra unos audífonos a Juan

1. 🛒 María hace la compra (microservicio de compras publica evento)
   Topic: orders.created
   ↓
   OrderConsumer procesa → Notifica a Juan: "Nueva orden recibida"
                        → Notifica a María: "Confirmación de compra"

2. 💳 Pago procesado (microservicio de pagos publica evento)
   Topic: payments.confirmed  
   ↓
   PaymentConsumer procesa → Notifica a Juan: "Pago confirmado, puedes enviar"

3. 📦 Juan marca como enviado (microservicio de órdenes publica evento)
   Topic: orders.status_changed
   ↓ 
   OrderConsumer procesa → Notifica a Juan: "Estado actualizado: enviado"

4. 🚚 Producto despachado (microservicio de envíos publica evento)
   Topic: orders.shipped
   ↓
   ShippingConsumer procesa → Notifica a María: "¡Tu pedido fue enviado!"

🔍 TODO ESTO SUCEDE AUTOMÁTICAMENTE:
• Cada evento genera notificaciones en tiempo real
• Se guarda historial completo en MongoDB  
• Se envían por múltiples canales (email, SMS, push)
• Métricas y logs para monitoreo
• Reintentos automáticos en caso de fallas

✨ ¡El sistema está LISTO para producción!
`);
