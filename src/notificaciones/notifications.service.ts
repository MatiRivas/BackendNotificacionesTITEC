import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas actualizados para tu BD
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Template, TemplateDocument, TemplateType, TemplateTypeDocument } from './schemas/template.schema';
import { Channel, ChannelDocument } from './schemas/channel.schema';

import { EmailService } from './channels/email.service';
import { UsersApiService } from '../external/users-api.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Mapeo de ID de plantilla a tipo de notificación para el frontend
  private readonly PLANTILLA_TO_TYPE = {
    1: 'order_created',        // Nueva venta (seller)
    2: 'order_created',        // Compra confirmada (buyer)
    3: 'order_status_changed', // Actualización de pedido
    4: 'order_shipped',        // Pedido enviado
    5: 'order_canceled',       // Pedido cancelado (genérico)
    6: 'payment_issue',        // Problema de pago
    7: 'payment_confirmed',    // Pago confirmado (buyer)
    8: 'payment_status',       // Pago rechazado (buyer)
    9: 'payment_confirmed',    // Pago recibido (seller)
    10: 'order_canceled',      // Venta cancelada por vendedor
    11: 'order_canceled',      // Compra cancelada por comprador
    12: 'order_ready_to_ship', // Listo para despacho
    13: 'message_received',    // Nuevo mensaje
    14: 'product_edited'       // Producto editado
  };

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
    @InjectModel(TemplateType.name)
    private templateTypeModel: Model<TemplateTypeDocument>,
    @InjectModel(Channel.name)
    private channelModel: Model<ChannelDocument>,
    private emailService: EmailService,
    private usersApiService: UsersApiService,
  ) {}

  /**
   * Crear notificación simple con tu estructura actual (SIN cache)
   */
  async createSimpleNotification(data: {
    id_emisor: string;
    id_receptor: string;
    id_plantilla: number;
    channel_ids: number[]; // Array de canales a usar
    context?: any;
  }): Promise<Notification> {
    try {
      // 1. Verificar que la plantilla existe
      const plantilla = await this.templateModel.findOne({ 
        id_Plantilla: data.id_plantilla 
      }).exec();
      
      if (!plantilla) {
        throw new Error(`Template ${data.id_plantilla} not found`);
      }

      // 2. Verificar que los canales existen
      const canales = await this.channelModel.find({ 
        id_canal: { $in: data.channel_ids }
      }).exec();
      
      if (canales.length !== data.channel_ids.length) {
        throw new Error('One or more channels not found');
      }

      // 3. Generar ID único de notificación
      const nextId = await this.getNextNotificationId();

      // 4. Crear notificación con metadata enriquecida
      const notification = new this.notificationModel({
        id_notificacion: nextId,
        fecha_hora: new Date(),
        id_emisor: data.id_emisor,
        id_receptor: data.id_receptor,
        id_plantilla: data.id_plantilla,
        channel_ids: data.channel_ids,
        estado: 'pendiente',
        metadata: data.context || {}, // Guardar metadata del evento
      });

      const saved = await notification.save();
      this.logger.log(`Created notification ${saved.id_notificacion} for user ${data.id_receptor}`);
      
      return saved;
    } catch (error) {
      this.logger.error(`Error creating notification:`, error);
      throw error;
    }
  }

  /**
   * Generar próximo ID de notificación
   */
  private async getNextNotificationId(): Promise<number> {
    const lastNotification = await this.notificationModel
      .findOne({}, {}, { sort: { id_notificacion: -1 } })
      .exec();
    
    return lastNotification ? lastNotification.id_notificacion + 1 : 1;
  }

  /**
   * Enviar notificación por todos sus canales
   */
  async sendNotification(notificationId: string): Promise<void> {
    try {
      // 1. Buscar notificación
      const notification = await this.notificationModel.findById(notificationId).exec();
      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      // 2. Obtener datos del receptor SIEMPRE desde API (sin cache)
      const receptorData = await this.usersApiService.getUser(notification.id_receptor);

      // 3. Obtener plantilla
      const template = await this.templateModel.findOne({
        id_Plantilla: notification.id_plantilla
      }).exec();

      if (!template) {
        throw new Error(`Template ${notification.id_plantilla} not found`);
      }

      // 4. Enviar por cada canal
      let enviadoExitoso = false;
      for (const canalId of notification.channel_ids) {
        try {
          const canal = await this.channelModel.findOne({ id_canal: canalId }).exec();
          if (!canal) {
            this.logger.warn(`Channel ${canalId} not found`);
            continue;
          }
          await this.notificationModel.findByIdAndUpdate(notificationId, {
            receptor_cache: receptorData
          });
        } catch (error) {
          this.logger.error(`Could not get user data for ${notification.id_receptor}`);
          if (!receptorData) {
            throw new Error('No user data available for sending notification');
          }
        }
      }

      // Obtener plantilla
      const plantilla = await this.templateModel.findOne({
        id_Plantilla: notification.id_plantilla
      }).exec();

      if (!plantilla) {
        throw new Error(`Template ${notification.id_plantilla} not found`);
      }

      // 4. Enviar por cada canal
      let successfulSend = false;
      for (const canalId of notification.channel_ids) {
        try {
          const canal = await this.channelModel.findOne({ id_canal: canalId }).exec();
          if (!canal) {
            this.logger.warn(`Channel ${canalId} not found`);
            continue;
          }

          // Enviar según el tipo de canal
          switch (canal.tipo_canal.toLowerCase()) {
            case 'email':
              if (receptorData.email) {
                await this.emailService.sendEmail({
                  to: receptorData.email,
                  subject: template.asunto_base || 'Notificación',
                  html: template.descripción_base,
                  context: {}, // Context para plantillas dinámicas si es necesario
                });
                successfulSend = true;
                this.logger.log(`Email sent to ${receptorData.email}`);
              }
              break;
              
            case 'sms':
              if (receptorData.telefono) {
                this.logger.log(`SMS would be sent to ${receptorData.telefono}: ${template.descripción_base}`);
                // TODO: Implementar SMS service
                successfulSend = true;
              }
              break;
              
            case 'push':
              if (receptorData.push_token) {
                this.logger.log(`Push would be sent to ${receptorData.push_token}: ${template.descripción_base}`);
                // TODO: Implementar Push service
                successfulSend = true;
              }
              break;
              
            default:
              this.logger.warn(`Unknown channel type: ${canal.tipo_canal}`);
          }
        } catch (error) {
          this.logger.error(`Error sending via channel ${canalId}:`, error);
        }
      }

      // Actualizar estado
      await this.notificationModel.findByIdAndUpdate(notificationId, {
        estado: successfulSend ? 'enviado' : 'fallido'
      });

    } catch (error) {
      this.logger.error(`Error sending notification ${notificationId}:`, error);
      await this.notificationModel.findByIdAndUpdate(notificationId, {
        estado: 'fallido'
      });
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario con formato enriquecido para frontend
   */
  async getUserNotifications(userId: string, limit = 20): Promise<any[]> {
    const notifications = await this.notificationModel
      .find({ id_receptor: userId })
      .sort({ fecha_hora: -1 })
      .limit(limit)
      .exec();

    // Enriquecer con información procesada de plantillas
    const enrichedNotifications = [];
    
    for (const notification of notifications) {
      const template = await this.templateModel.findOne({ 
        id_Plantilla: notification.id_plantilla 
      }).exec();
      
      const notifObj = notification.toObject();
      
      // Procesar plantilla con datos del metadata
      const title = template?.asunto_base ? 
        this.processTemplate(template.asunto_base, notifObj.metadata || {}) : 
        'Notificación';
      
      const message = template?.descripción_base ? 
        this.processTemplate(template.descripción_base, notifObj.metadata || {}) : 
        '';
      
      const enriched = {
        id_notificacion: notifObj.id_notificacion,
        fecha_hora: notifObj.fecha_hora,
        id_emisor: notifObj.id_emisor,
        id_receptor: notifObj.id_receptor,
        id_plantilla: notifObj.id_plantilla,
        channel_ids: notifObj.channel_ids,
        estado: notifObj.estado,
        type: this.PLANTILLA_TO_TYPE[notifObj.id_plantilla] || 'notification',
        title: title,
        message: message,
        metadata: this.enrichMetadata(notifObj.metadata || {}, notifObj.id_plantilla)
      };
      
      enrichedNotifications.push(enriched);
    }

    return enrichedNotifications;
  }

  /**
   * Procesar plantilla reemplazando variables con valores reales
   */
  private processTemplate(template: string, data: any): string {
    let processed = template;
    
    // Mapeo de variables a campos del metadata
    const variableMap = {
      '{comprador}': data.buyerName || data.comprador || 'Usuario',
      '{vendedor}': data.vendorName || data.sellerName || data.vendedor || 'Vendedor',
      '{producto}': data.productName || data.producto || 'Producto',
      '{orden}': data.orderId || data.orden_id || data.orden || 'N/A',
      '{monto}': data.amount ? `$${data.amount.toLocaleString('es-CL')}` : (data.monto ? `$${data.monto.toLocaleString('es-CL')}` : '$0'),
      '{estado}': data.estadoPedido || data.status || data.estado || 'Pendiente',
      '{usuario}': data.userName || data.usuario || 'Usuario',
      '{motivo}': data.cancellationReason || data.rejectionReason || data.motivo || 'No especificado',
      '{direccion}': data.deliveryAddress || data.direccion || '',
      '{telefono}': data.buyerPhone || data.sellerPhone || data.telefono || '',
      '{mensaje}': data.messagePreview || data.mensaje || '',
      '{remitente}': data.senderName || data.remitente || 'Usuario',
      '{campos}': data.changedFields ? data.changedFields.join(', ') : 'varios campos'
    };
    
    // Reemplazar cada variable
    for (const [variable, value] of Object.entries(variableMap)) {
      processed = processed.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), String(value));
    }
    
    return processed;
  }

  /**
   * Enriquecer metadata con campos específicos según el tipo de notificación
   */
  private enrichMetadata(metadata: any, plantillaId: number): any {
    const type = this.PLANTILLA_TO_TYPE[plantillaId];
    const enriched: any = { ...metadata };
    
    // Agregar actionUrl si no existe
    if (!enriched.actionUrl && enriched.orderId) {
      enriched.actionUrl = `/orders/${enriched.orderId}`;
    }
    
    // Formatear montos como números
    if (enriched.amount && typeof enriched.amount === 'string') {
      enriched.amount = parseFloat(enriched.amount);
    }
    if (enriched.monto && typeof enriched.monto === 'string') {
      enriched.amount = parseFloat(enriched.monto);
      delete enriched.monto;
    }
    
    // Agregar currency si no existe
    if (enriched.amount && !enriched.currency) {
      enriched.currency = 'CLP';
    }
    
    // Para payment_status, asegurar que existe paymentOutcome
    if (type === 'payment_status' && !enriched.paymentOutcome) {
      enriched.paymentOutcome = enriched.tipo_problema === 'rechazado' ? 'rejected' : 'pending';
    }
    
    // Para order_canceled, asegurar helpCenterUrl
    if (type === 'order_canceled' && !enriched.helpCenterUrl) {
      enriched.helpCenterUrl = '/help/cancellation';
    }
    
    return enriched;
  }

  /**
   * Estadísticas básicas
   */
  async getStats() {
    const total = await this.notificationModel.countDocuments();
    const pendientes = await this.notificationModel.countDocuments({ estado: 'pendiente' });
    const enviados = await this.notificationModel.countDocuments({ estado: 'enviado' });
    const fallidos = await this.notificationModel.countDocuments({ estado: 'fallido' });

    return {
      total,
      pendientes,
      enviados, 
      fallidos,
      byStatus: {
        pendiente: pendientes,
        enviado: enviados,
        fallido: fallidos
      },
      byChannel: {
        // Esto requeriría agregación más compleja, por ahora básico
        email: 0,
        sms: 0,
        push: 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check para email
   */
  async healthCheckEmail(): Promise<boolean> {
    try {
      // Implementar test de conectividad de email
      return true;
    } catch (error) {
      this.logger.error('Email health check failed:', error);
      return false;
    }
  }

  /**
   * Métodos de compatibilidad para mantener funcionalidad existente
   */
  
  // Alias para compatibilidad con consumers
  async createNotificationFromEvent(data: {
    eventType: string;
    recipients: Array<{ userId: string; email?: string; phone?: string; role?: string }>;
    channels?: string[];
    priority?: string;
    templateData?: any;
    eventData?: any; // Para compatibilidad
    templateType?: string; // Para compatibilidad
  }) {
    this.logger.log(`Creating notifications for event: ${data.eventType}`);
    
    const notifications = [];
    
    for (const recipient of data.recipients) {
      try {
        // Determinar plantilla según el rol del destinatario
        let plantillaId;
        if (recipient.role === 'seller' || recipient.role === 'vendedor') {
          plantillaId = this.mapEventToTemplateSeller(data.eventType);
        } else {
          plantillaId = this.mapEventToTemplateBuyer(data.eventType);
        }
        
        // Construir metadata enriquecida con datos del evento
        const enrichedMetadata = this.buildMetadataFromEvent(data.eventData, recipient.role);
        
        const notification = await this.createSimpleNotification({
          id_emisor: 'system',
          id_receptor: recipient.userId,
          id_plantilla: plantillaId,
          channel_ids: [1, 2],
          context: { ...data.templateData, ...enrichedMetadata }
        });
        
        notifications.push(notification);
      } catch (error) {
        this.logger.error(`Error creating notification for ${recipient.userId}:`, error);
      }
    }
    
    return notifications;
  }

  /**
   * Construir metadata desde eventData
   */
  private buildMetadataFromEvent(eventData: any, role?: string): any {
    if (!eventData) return {};
    
    const metadata: any = {
      orderId: eventData.orderId || eventData.orden_id,
      amount: eventData.totalAmount || eventData.amount || eventData.monto,
      currency: 'CLP'
    };
    
    // Datos de orden
    if (eventData.buyerId) metadata.buyerId = eventData.buyerId;
    if (eventData.sellerId) metadata.sellerId = eventData.sellerId;
    if (eventData.buyerEmail) metadata.buyerEmail = eventData.buyerEmail;
    if (eventData.sellerEmail) metadata.sellerEmail = eventData.sellerEmail;
    
    // Nombres (necesitarían venir del evento o consultarse)
    if (eventData.buyerName) metadata.buyerName = eventData.buyerName;
    if (eventData.sellerName || eventData.vendorName) metadata.vendorName = eventData.sellerName || eventData.vendorName;
    
    // Productos
    if (eventData.products && eventData.products.length > 0) {
      metadata.productName = eventData.products[0].productName;
      metadata.productId = eventData.products[0].productId;
    }
    if (eventData.productName) metadata.productName = eventData.productName;
    
    // Estados y razones
    if (eventData.newStatus || eventData.status) metadata.estadoPedido = eventData.newStatus || eventData.status;
    if (eventData.cancellationReason || eventData.motivo) metadata.cancellationReason = eventData.cancellationReason || eventData.motivo;
    if (eventData.rejectionReason) metadata.rejectionReason = eventData.rejectionReason;
    
    // Pagos
    if (eventData.paymentMethod) metadata.paymentMethod = eventData.paymentMethod;
    if (eventData.issueType || eventData.tipo_problema) metadata.issueType = eventData.issueType || eventData.tipo_problema;
    
    // Envíos
    if (eventData.trackingNumber) metadata.trackingNumber = eventData.trackingNumber;
    if (eventData.carrier) metadata.carrier = eventData.carrier;
    if (eventData.estimatedDelivery) metadata.estimatedDelivery = eventData.estimatedDelivery;
    if (eventData.shippedAt) metadata.shippedAt = eventData.shippedAt;
    if (eventData.deliveryAddress) metadata.deliveryAddress = eventData.deliveryAddress;
    if (eventData.buyerPhone) metadata.buyerPhone = eventData.buyerPhone;
    
    // Mensajes
    if (eventData.senderName) metadata.senderName = eventData.senderName;
    if (eventData.messagePreview) metadata.messagePreview = eventData.messagePreview;
    if (eventData.conversationId) metadata.conversationId = eventData.conversationId;
    
    // Productos editados
    if (eventData.changedFields) metadata.changedFields = eventData.changedFields;
    
    // Action URL
    if (metadata.orderId) {
      metadata.actionUrl = `/orders/${metadata.orderId}`;
    }
    
    return metadata;
  }

  // Mapeo de eventos a plantillas (deprecated - usar métodos específicos por rol)
  private mapEventToTemplate(eventType: string): number {
    const mapping = {
      'order_created': 1,
      'order_confirmed': 2, 
      'order_status_changed': 3,
      'order_shipped': 4,
      'order_cancelled': 5,
      'payment_confirmed': 6,
      'payment_rejected': 6,
      'payment_issue': 7,
    };
    
    return mapping[eventType] || 1; // Default a plantilla 1
  }

  // Mapeo de eventos a plantillas para COMPRADORES
  private mapEventToTemplateBuyer(eventType: string): number {
    const mapping = {
      'order_created': 2,        // Tu pedido fue creado
      'order_confirmed': 2,      // Tu pedido fue confirmado
      'order_status_changed': 3, // Estado de tu pedido cambió
      'order_shipped': 4,        // Tu pedido fue enviado
      'order_cancelled': 5,      // Tu pedido fue cancelado
      'payment_confirmed': 7,    // Tu pago fue confirmado
      'payment_rejected': 8,     // Tu pago fue rechazado
      'payment_issue': 6,        // Problema con tu pago
    };
    
    return mapping[eventType] || 2; // Default a plantilla 2
  }

  // Mapeo de eventos a plantillas para VENDEDORES
  private mapEventToTemplateSeller(eventType: string): number {
    const mapping = {
      'order_created': 1,        // Nueva venta creada
      'order_confirmed': 9,      // Venta confirmada
      'order_status_changed': 10, // Estado de venta cambió
      'order_shipped': 11,       // Producto enviado
      'order_cancelled': 12,     // Venta cancelada
      'payment_confirmed': 9,    // Pago recibido
      'payment_rejected': 6,     // Problema con pago de venta
      'payment_issue': 6,        // Problema con pago de venta
    };
    
    return mapping[eventType] || 1; // Default a plantilla 1 (nueva venta)
  }

  // Métodos para el controller
  async getAllTemplates() {
    return this.templateModel.find().exec();
  }

  async getAllChannels() {
    return this.channelModel.find().exec();
  }

  async getAllTemplateTypes() {
    return this.templateTypeModel.find().exec();
  }

  async createNotification(data: any) {
    return this.createSimpleNotification(data);
  }

  async getNotificationsByUserId(userId: number, page = 1, limit = 20) {
    return this.getUserNotifications(userId.toString(), limit);
  }

  async getBasicNotificationStats() {
    return this.getStats();
  }

  async getNotificationsByUser(userId: string, page = 1, limit = 20) {
    return this.getUserNotifications(userId, limit);
  }

  async getNotificationStats() {
    return this.getStats();
  }

  /**
   * Marcar una notificación como leída
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.notificationModel.findByIdAndUpdate(
        notificationId,
        { estado: 'leido' },
        { new: true }
      ).exec();

      if (!result) {
        return {
          success: false,
          message: 'Notificación no encontrada'
        };
      }

      this.logger.log(`Notification ${notificationId} marked as read`);
      return {
        success: true,
        message: 'Notificación marcada como leída'
      };
    } catch (error) {
      this.logger.error(`Error marking notification as read:`, error);
      return {
        success: false,
        message: 'Error al marcar la notificación como leída'
      };
    }
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean; message: string; updated: number }> {
    try {
      const result = await this.notificationModel.updateMany(
        { _id: { $in: notificationIds } },
        { estado: 'leido' }
      ).exec();

      this.logger.log(`${result.modifiedCount} notifications marked as read`);
      return {
        success: true,
        message: `${result.modifiedCount} notificaciones marcadas como leídas`,
        updated: result.modifiedCount
      };
    } catch (error) {
      this.logger.error(`Error marking multiple notifications as read:`, error);
      return {
        success: false,
        message: 'Error al marcar las notificaciones como leídas',
        updated: 0
      };
    }
  }

  async retryFailedNotifications() {
    const failedNotifications = await this.notificationModel
      .find({ estado: 'fallido' })
      .limit(10)
      .exec();

    for (const notification of failedNotifications) {
      try {
        await this.sendNotification(notification._id.toString());
      } catch (error) {
        this.logger.error(`Failed to retry notification ${notification._id}:`, error);
      }
    }

    return { retriedCount: failedNotifications.length };
  }
}