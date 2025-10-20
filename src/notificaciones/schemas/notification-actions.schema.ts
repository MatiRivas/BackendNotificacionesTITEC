import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationActionsDocument = NotificationActions & Document;

/**
 * 🎯 Schema para acciones específicas en notificaciones
 * Implementa HDU8: Enlaces directos para subir evidencia, responder disputas, etc.
 */
@Schema({
  timestamps: true,
  collection: 'notification_actions'
})
export class NotificationActions {
  @Prop({ required: true })
  notificationId: string;

  @Prop({ 
    type: String,
    enum: ['payment_retry', 'upload_evidence', 'respond_dispute', 'contact_support', 'view_order'],
    required: true
  })
  actionType: string;

  @Prop({ required: true })
  actionUrl: string;

  @Prop({ default: '' })
  actionLabel: string;

  @Prop({ 
    type: String,
    enum: ['primary', 'secondary', 'warning', 'danger'],
    default: 'primary'
  })
  priority: string;

  @Prop({ default: null })
  expiresAt: Date;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: null })
  completedAt: Date;

  @Prop({ 
    type: MongooseSchema.Types.Mixed, 
    default: {} 
  })
  metadata: {
    orderId?: string;
    paymentId?: string;
    disputeId?: string;
    [key: string]: any;
  };
}

export const NotificationActionsSchema = SchemaFactory.createForClass(NotificationActions);

// Índices para optimizar consultas
NotificationActionsSchema.index({ notificationId: 1 });
NotificationActionsSchema.index({ notificationId: 1, isCompleted: 1 });
NotificationActionsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });