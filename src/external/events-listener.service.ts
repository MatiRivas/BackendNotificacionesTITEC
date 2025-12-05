import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, ChangeStream, ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notificaciones/notifications.service';

@Injectable()
export class EventsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsListenerService.name);
  private client: MongoClient;
  private ordersStream: ChangeStream;
  private paymentsStream: ChangeStream;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    try {
      // Conectar a la BD de eventos simulada
      const eventsDbUri = 'mongodb+srv://MatiRivas_cluster:matiasrivas1@cluster0.2rxdxu8.mongodb.net/EventsSimulator';
      this.client = new MongoClient(eventsDbUri);
      await this.client.connect();
      
      this.logger.log('🔗 Conectado a BD de eventos para Change Streams');

      // Inicializar listeners
      await this.setupOrdersListener();
      await this.setupPaymentsListener();

      this.logger.log('🎧 Change Streams activados - Escuchando eventos en tiempo real');
    } catch (error) {
      this.logger.error('❌ Error inicializando Change Streams:', error);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.ordersStream) {
        await this.ordersStream.close();
      }
      if (this.paymentsStream) {
        await this.paymentsStream.close();
      }
      if (this.client) {
        await this.client.close();
      }
      this.logger.log('🔌 Change Streams desconectados');
    } catch (error) {
      this.logger.error('❌ Error cerrando Change Streams:', error);
    }
  }

  /**
   * 📦 Escuchar cambios en la colección de órdenes
   */
  private async setupOrdersListener() {
    const db = this.client.db('EventsSimulator');
    const ordersCollection = db.collection('orders_events');

    this.ordersStream = ordersCollection.watch([
      {
        $match: {
          $or: [
            { 'operationType': 'insert' },
            { 
              'operationType': 'update',
              'updateDescription.updatedFields.status': { $exists: true }
            }
          ]
        }
      }
    ]);

    this.ordersStream.on('change', async (change: any) => {
      try {
        if (change.operationType === 'insert') {
          this.logger.log('📦 Nueva orden detectada via Change Stream');
          const orderData = change.fullDocument;
          await this.processOrderCreated(orderData);
        } else if (change.operationType === 'update') {
          this.logger.log('📦 Actualización de orden detectada via Change Stream');
          // Obtener el documento completo actualizado
          const db = this.client.db('EventsSimulator');
          const order = await db.collection('orders_events').findOne({ _id: change.documentKey._id });
          await this.processOrderUpdated(order);
        }
      } catch (error) {
        this.logger.error('❌ Error procesando orden:', error);
      }
    });

    this.logger.log('🎧 Listener de órdenes activado');
  }

  /**
   * 💳 Escuchar cambios en la colección de pagos
   */
  private async setupPaymentsListener() {
    const db = this.client.db('EventsSimulator');
    const paymentsCollection = db.collection('payments_events');

    this.paymentsStream = paymentsCollection.watch([
      {
        $match: {
          $or: [
            { 'operationType': 'insert' },
            { 
              'operationType': 'update',
              'updateDescription.updatedFields.status': { $exists: true }
            }
          ]
        }
      }
    ]);

    this.paymentsStream.on('change', async (change: any) => {
      try {
        this.logger.log('💳 Cambio en pago detectado via Change Stream');
        
        if (change.operationType === 'insert') {
          await this.processPaymentCreated(change.fullDocument);
        } else if (change.operationType === 'update') {
          // Obtener el documento completo actualizado
          const db = this.client.db('EventsSimulator');
          const payment = await db.collection('payments_events').findOne({ _id: change.documentKey._id });
          await this.processPaymentUpdated(payment);
        }
      } catch (error) {
        this.logger.error('❌ Error procesando pago:', error);
      }
    });

    this.logger.log('🎧 Listener de pagos activado');
  }

  /**
   * 📦 Procesar orden creada
   */
  private async processOrderCreated(orderData: any) {
    this.logger.log(`📦 Procesando orden creada: ${orderData.orderId}`);

    try {
      // Notificación para el comprador
      const buyerNotification = await this.notificationsService.createSimpleNotification({
        id_emisor: 'orders-service',
        id_receptor: orderData.buyerId,
        id_plantilla: 1, // Template "Tu orden fue creada"
        channel_ids: [1, 3], // Email + Push
        context: {
          monto: orderData.totalAmount,
          numero_orden: orderData.orderId
        }
      });

      // Notificación para el vendedor
      const sellerNotification = await this.notificationsService.createSimpleNotification({
        id_emisor: 'orders-service',
        id_receptor: orderData.sellerId,
        id_plantilla: 2, // Template "Tienes una nueva venta"
        channel_ids: [1, 3], // Email + Push
        context: {
          monto: orderData.totalAmount,
          numero_orden: orderData.orderId
        }
      });

      // 🚀 Procesar automáticamente las notificaciones con estados progresivos
      if (buyerNotification) {
        this.processNotificationStates((buyerNotification as any)._id.toString(), 'comprador');
      }

      if (sellerNotification) {
        this.processNotificationStates((sellerNotification as any)._id.toString(), 'vendedor');
      }

      this.logger.log(`✅ Notificaciones creadas para orden ${orderData.orderId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando notificaciones para orden ${orderData.orderId}:`, error);
    }
  }

  /**
   * 📦 Procesar orden actualizada (cancelaciones, confirmaciones, etc.)
   */
  private async processOrderUpdated(orderData: any) {
    this.logger.log(`📦 Procesando actualización de orden: ${orderData.orderId} - ${orderData.status}`);

    try {
      if (orderData.status === 'cancelled') {
        // Notificar al comprador sobre cancelación
        const buyerCancelNotification = await this.notificationsService.createSimpleNotification({
          id_emisor: 'orders-service',
          id_receptor: orderData.buyerId,
          id_plantilla: 5, // Template "Pedido cancelado"
          channel_ids: [1, 3], // Email + Push
          context: {
            monto: orderData.totalAmount,
            numero_orden: orderData.orderId,
            razon_cancelacion: orderData.cancellationReason || 'solicitud_usuario'
          }
        });

        // Notificar al vendedor sobre cancelación
        const sellerCancelNotification = await this.notificationsService.createSimpleNotification({
          id_emisor: 'orders-service',
          id_receptor: orderData.sellerId,
          id_plantilla: 5, // Template "Pedido cancelado"
          channel_ids: [1, 3], // Email + Push
          context: {
            monto: orderData.totalAmount,
            numero_orden: orderData.orderId,
            razon_cancelacion: orderData.cancellationReason || 'solicitud_usuario'
          }
        });

        // 🚀 Procesar automáticamente las notificaciones de cancelación
        if (buyerCancelNotification) {
          this.processNotificationStates((buyerCancelNotification as any)._id.toString(), 'comprador-cancelacion');
        }

        if (sellerCancelNotification) {
          this.processNotificationStates((sellerCancelNotification as any)._id.toString(), 'vendedor-cancelacion');
        }

        this.logger.log(`✅ Notificaciones de cancelación enviadas para orden ${orderData.orderId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error procesando actualización de orden ${orderData.orderId}:`, error);
    }
  }

  /**
   * 💳 Procesar pago creado
   */
  private async processPaymentCreated(paymentData: any) {
    this.logger.log(`💳 Procesando pago creado: ${paymentData.paymentId}`);
    // Por ahora solo logueamos, las notificaciones se envían cuando se actualiza el estado
  }

  /**
   * 💳 Procesar pago actualizado
   */
  private async processPaymentUpdated(paymentData: any) {
    this.logger.log(`💳 Procesando actualización de pago: ${paymentData.paymentId} - ${paymentData.status}`);

    try {
      if (paymentData.status === 'confirmed') {
        // Notificar al vendedor sobre pago confirmado
        const paymentNotification = await this.notificationsService.createSimpleNotification({
          id_emisor: 'payments-service',
          id_receptor: paymentData.sellerId,
          id_plantilla: 6, // Template "Pago confirmado"
          channel_ids: [1, 3], // Email + Push
          context: {
            monto: paymentData.amount,
            numero_orden: paymentData.orderId
          }
        });

        // 🚀 Procesar automáticamente la notificación con estados progresivos
        if (paymentNotification) {
          this.processNotificationStates((paymentNotification as any)._id.toString(), 'vendedor-pago');
        }

        this.logger.log(`✅ Notificación de pago confirmado enviada para ${paymentData.paymentId}`);

      } else if (paymentData.status === 'rejected') {
        // Notificar al comprador sobre pago rechazado
        const rejectionNotification = await this.notificationsService.createSimpleNotification({
          id_emisor: 'payments-service',
          id_receptor: paymentData.buyerId,
          id_plantilla: 7, // Template "Problema con pago"
          channel_ids: [1, 3], // Email + Push
          context: {
            monto: paymentData.amount,
            tipo_problema: paymentData.reason || 'payment_failed',
            accion_requerida: 'reintentar_pago'
          }
        });

        // 🚀 Procesar automáticamente la notificación de rechazo con estados progresivos
        if (rejectionNotification) {
          this.processNotificationStates((rejectionNotification as any)._id.toString(), 'comprador-rechazo');
        }

        this.logger.log(`✅ Notificación de pago rechazado enviada para ${paymentData.paymentId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error procesando actualización de pago ${paymentData.paymentId}:`, error);
    }
  }

  /**
   * 📊 Obtener estadísticas del listener
   */
  getListenerStats() {
    return {
      ordersStreamActive: this.ordersStream && !this.ordersStream.closed,
      paymentsStreamActive: this.paymentsStream && !this.paymentsStream.closed,
      connected: !!this.client,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔄 Procesar estados progresivos de notificación (pendiente → enviado → recibido → leído)
   */
  private async processNotificationStates(notificationId: string, userType: string) {
    try {
      // 1. Estado: pendiente → enviado (después de 1-2 segundos)
      setTimeout(async () => {
        try {
          await this.notificationsService.sendNotification(notificationId);
          this.logger.log(`📧 [${userType}] Notificación enviada: ${notificationId}`);
        } catch (error) {
          this.logger.error(`❌ [${userType}] Error enviando notificación:`, error);
        }
      }, Math.random() * 1000 + 1000); // 1-2 segundos

      // 2. Estado: enviado → recibido (después de 3-5 segundos)
      setTimeout(async () => {
        try {
          await this.updateNotificationStatus(notificationId, 'recibido');
          this.logger.log(`📱 [${userType}] Notificación recibida: ${notificationId}`);
        } catch (error) {
          this.logger.error(`❌ [${userType}] Error marcando como recibida:`, error);
        }
      }, Math.random() * 2000 + 3000); // 3-5 segundos

      // 3. Estado: recibido → leído (después de 5-10 segundos, solo 70% de las veces)
      if (Math.random() > 0.3) { // 70% probabilidad de ser leída
        setTimeout(async () => {
          try {
            await this.updateNotificationStatus(notificationId, 'leido');
            this.logger.log(`👁️ [${userType}] Notificación leída: ${notificationId}`);
          } catch (error) {
            this.logger.error(`❌ [${userType}] Error marcando como leída:`, error);
          }
        }, Math.random() * 5000 + 5000); // 5-10 segundos
      }
    } catch (error) {
      this.logger.error(`❌ Error en procesamiento de estados para ${notificationId}:`, error);
    }
  }

  /**
   * 🔄 Actualizar estado de notificación usando el NotificationsService
   */
  private async updateNotificationStatus(notificationId: string, estado: string) {
    try {
      // Usar el servicio de notificaciones para acceso directo al modelo
      await (this.notificationsService as any).notificationModel.findByIdAndUpdate(
        notificationId,
        { 
          $set: { 
            estado: estado, 
            fecha_actualizacion: new Date() 
          } 
        }
      );
    } catch (error) {
      this.logger.error(`Error actualizando estado a ${estado}:`, error);
    }
  }
}