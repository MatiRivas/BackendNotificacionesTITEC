/**
 * 📋 ANÁLISIS: Nuevas funcionalidades requeridas para Sprint 2
 */

console.log(`
📋 NUEVAS FUNCIONALIDADES REQUERIDAS - SPRINT 2:
════════════════════════════════════════════════════════════

🔄 HDU6: Notificación de pago confirmado/rechazado al COMPRADOR
────────────────────────────────────────────────────────────
NUEVO REQUERIMIENTO:
• Notificar pago rechazado (nuevo evento)
• Máximo 5 segundos de latencia
• Fallback si email falla → notificación interna

ARCHIVOS A CREAR/MODIFICAR:
✅ src/kafka/dto/payment-event.dto.ts (agregar PaymentRejectedEventDto)
✅ src/kafka/consumers/payment.consumer.ts (manejar pago rechazado)
✅ src/notificaciones/channels/internal.service.ts (nuevo canal)

🔄 HDU7: Notificaciones con FALLBACK y CANALES CONFIGURABLES
────────────────────────────────────────────────────────────
NUEVOS REQUERIMIENTOS:
• Sistema de fallback automático
• Preferencias de usuario por canal
• Registro de intentos fallidos
• Canales: email, push, SMS, internal

ARCHIVOS A CREAR:
🆕 src/notificaciones/schemas/user-preferences.schema.ts
🆕 src/notificaciones/services/fallback.service.ts
🆕 src/notificaciones/services/channel-manager.service.ts
🆕 src/notificaciones/dto/user-preferences.dto.ts

ENDPOINTS NUEVOS NECESARIOS:
🆕 GET /notifications/user/:id/preferences
🆕 PUT /notifications/user/:id/preferences

🔄 HDU8: Problemas de pago (rechazado, reembolso, disputa)
────────────────────────────────────────────────────────────
NUEVOS REQUERIMIENTOS:
• Eventos de problemas de pago
• Notificaciones con acciones específicas
• Templates con enlaces y plazos
• Escalamiento de prioridad

ARCHIVOS A CREAR:
🆕 src/kafka/dto/payment-issue-event.dto.ts
🆕 src/kafka/consumers/payment-issue.consumer.ts
🆕 src/notificaciones/templates/payment-issue.templates.ts
🆕 src/notificaciones/schemas/notification-actions.schema.ts
`);

console.log(`
📁 ESTRUCTURA COMPLETA DE ARCHIVOS A CREAR:
════════════════════════════════════════════════════════════

📡 KAFKA (Nuevos eventos):
├── src/kafka/dto/
│   ├── payment-event.dto.ts           ← MODIFICAR (agregar rejected)
│   └── payment-issue-event.dto.ts     ← NUEVO
├── src/kafka/consumers/
│   ├── payment.consumer.ts            ← MODIFICAR (manejar rejected)
│   └── payment-issue.consumer.ts      ← NUEVO
└── src/kafka/kafka.module.ts          ← MODIFICAR (agregar consumers)

📧 NOTIFICACIONES (Sistema avanzado):
├── src/notificaciones/channels/
│   ├── internal.service.ts            ← NUEVO (notif interna)
│   └── channel.interface.ts           ← MODIFICAR (fallback support)
├── src/notificaciones/services/
│   ├── fallback.service.ts            ← NUEVO (manejo de fallback)
│   ├── channel-manager.service.ts     ← NUEVO (selección de canal)
│   └── user-preferences.service.ts    ← NUEVO (preferencias usuario)
├── src/notificaciones/schemas/
│   ├── user-preferences.schema.ts     ← NUEVO
│   ├── notification-actions.schema.ts ← NUEVO
│   └── notification-history.schema.ts ← MODIFICAR (fallback info)
├── src/notificaciones/dto/
│   ├── user-preferences.dto.ts        ← NUEVO
│   └── notification-context.dto.ts    ← MODIFICAR (fallback options)
└── src/notificaciones/templates/
    └── payment-issue.templates.ts     ← NUEVO

🎛️ CONTROLLERS (Nuevos endpoints):
└── src/notificaciones/
    ├── notifications.controller.ts    ← MODIFICAR (agregar endpoints)
    └── preferences.controller.ts      ← NUEVO

🔧 CONFIG:
└── src/config/
    └── kafka.config.ts               ← MODIFICAR (nuevos topics)
`);

console.log(`
🆕 NUEVOS ENDPOINTS NECESARIOS:
════════════════════════════════════════════════════════════

👤 GESTIÓN DE PREFERENCIAS:
────────────────────────────────────────────────────────────
GET /notifications/user/:userId/preferences
   • Obtener preferencias de canales del usuario
   • Respuesta: { "channels": ["email", "push"], "enabled": true }

PUT /notifications/user/:userId/preferences  
   • Actualizar preferencias de notificación
   • Body: { 
       "preferredChannels": ["email", "internal"],
       "enableNotifications": true,
       "quietHours": { "start": "22:00", "end": "08:00" }
     }

🔄 GESTIÓN DE FALLBACK:
────────────────────────────────────────────────────────────
GET /notifications/:id/attempts
   • Ver intentos de envío y fallbacks de una notificación
   • Respuesta: [
       { "channel": "push", "status": "failed", "attempt": 1 },
       { "channel": "email", "status": "sent", "attempt": 2 }
     ]

POST /notifications/:id/retry
   • Forzar reintento de notificación específica
   • Body: { "channel": "email" } (opcional)

📱 NOTIFICACIONES INTERNAS:
────────────────────────────────────────────────────────────
GET /notifications/user/:userId/internal
   • Solo notificaciones internas no leídas
   • Para mostrar en la app cuando otros canales fallan

PATCH /notifications/:id/read
   • Marcar notificación como leída
   • Body: { "readAt": "2025-10-17T23:50:00Z" }
`);

console.log(`
❓ ¿POR QUÉ ESTOS ENDPOINTS SON NECESARIOS AHORA?
════════════════════════════════════════════════════════════

🔄 DIFERENCIA CON SPRINT 1:
Sprint 1: Solo automatización (event-driven)
Sprint 2: Automatización + Configuración del usuario

📱 CASOS DE USO QUE LO REQUIEREN:

1️⃣ HDU6 - "Si falla el envío de correo, debe verse la notificación interna"
   → Necesitas GET /notifications/user/:id/internal

2️⃣ HDU7 - "El comprador puede elegir el canal de notificación"
   → Necesitas GET/PUT /preferences

3️⃣ HDU7 - "Si el usuario ha desactivado las notificaciones, no se le envían"
   → Necesitas verificar preferencias antes de enviar

4️⃣ HDU7 - "Fallback en caso de error... se reintenta por otro canal"
   → Necesitas lógica de fallback automático

5️⃣ HDU8 - "Enlace directo para subir evidencia"
   → Necesitas templates con acciones específicas
`);

console.log(`
🎯 CONCLUSIÓN - ENDPOINTS NECESARIOS:
════════════════════════════════════════════════════════════

✅ MÍNIMOS REQUERIDOS (para cumplir HDUs):
1. GET /notifications/user/:id/preferences
2. PUT /notifications/user/:id/preferences  
3. GET /notifications/user/:id/internal
4. PATCH /notifications/:id/read

⚡ OPCIONALES (para mejor UX):
5. GET /notifications/:id/attempts
6. POST /notifications/:id/retry

🚫 NO NECESARIOS (se maneja automáticamente):
• POST /notifications/create (sigue siendo automático)
• PUT /notifications/:id (no se editan, se crean nuevas)
• Endpoints de templates (los admins los manejan por código)

📊 RESUMEN:
Pasas de 5 endpoints (Sprint 1) a 9 endpoints (Sprint 2)
Esto es normal porque agregas funcionalidad de configuración de usuario.
`);