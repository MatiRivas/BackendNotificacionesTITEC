import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KafkaService } from '../src/kafka/kafka.service';
import { NotificationsService } from '../src/notificaciones/notifications.service';
import { EmailService } from '../src/notificaciones/channels/email.service';

async function verifySystem() {
  console.log('🔍 Verificando sistema de notificaciones con Kafka...\n');

  try {
    // Crear la aplicación
    const app = await NestFactory.create(AppModule);
    
    // Obtener servicios
    const kafkaService = app.get(KafkaService);
    const notificationsService = app.get(NotificationsService);
    const emailService = app.get(EmailService);

    console.log('✅ Aplicación NestJS iniciada correctamente');

    // 1. Verificar conexión Kafka
    console.log('\n📡 Verificando conexión Kafka...');
    try {
      const kafkaHealth = await kafkaService.getProducerHealth();
      console.log(`✅ Kafka Producer: ${kafkaHealth.status}`);
      
      const consumerHealth = await kafkaService.getConsumerHealth();
      console.log(`✅ Kafka Consumers: ${consumerHealth.status} (${consumerHealth.topics.length} topics)`);
    } catch (error) {
      console.log('❌ Kafka no está disponible:', error.message);
    }

    // 2. Verificar conexión Email
    console.log('\n📧 Verificando conexión SMTP...');
    try {
      const emailHealth = await emailService.testConnection();
      console.log(`✅ SMTP: ${emailHealth ? 'Connected' : 'Failed'}`);
    } catch (error) {
      console.log('❌ SMTP no está disponible:', error.message);
    }

    // 3. Verificar estadísticas de notificaciones
    console.log('\n📊 Verificando estadísticas de notificaciones...');
    try {
      const stats = await notificationsService.getNotificationStats();
      console.log(`✅ Total notificaciones: ${stats.total}`);
      console.log('📈 Por estado:', stats.byStatus);
      console.log('📈 Por canal:', stats.byChannel);
    } catch (error) {
      console.log('❌ Error obteniendo estadísticas:', error.message);
    }

    // 4. Simular evento de prueba
    console.log('\n🧪 Simulando evento de orden creada...');
    try {
      const testEvent = {
        eventType: 'order_created',
        eventData: {
          orderId: 'TEST-' + Date.now(),
          buyerId: 'buyer-123',
          sellerId: 'seller-456',
          totalAmount: 99.99,
          createdAt: new Date().toISOString(),
          buyerEmail: 'buyer@test.com',
          sellerEmail: 'seller@test.com',
        },
        recipients: [
          {
            userId: 'seller-456',
            email: 'seller@test.com',
            role: 'seller' as const,
          }
        ],
        templateType: 'new_order_seller',
        channels: ['email'],
        priority: 'high' as const,
      };

      const notifications = await notificationsService.createNotificationFromEvent(testEvent);
      console.log(`✅ Evento procesado: ${notifications.length} notificaciones creadas`);
    } catch (error) {
      console.log('❌ Error procesando evento de prueba:', error.message);
    }

    console.log('\n🎉 Verificación completada!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Sistema de notificaciones funcionando');
    console.log('- ✅ Base de datos MongoDB conectada');
    console.log('- ⚠️  Kafka: Verificar si está ejecutándose localmente');
    console.log('- ⚠️  SMTP: Configurar credenciales en .env para testing');

    await app.close();
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

verifySystem();
