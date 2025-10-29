import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface NotificationHistoryDocument extends NotificationHistory, Document {
  id: string;
}

export enum NotificationHistoryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  RETRY = 'retry',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Schema({
  collection: 'notification_history',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class NotificationHistory {
  @Prop({ required: true, type: String })
  eventId: string; // ID del evento original de Kafka

  @Prop({ required: true, type: String })
  eventType: string; // order_created, payment_confirmed, etc.

  @Prop({ required: true, type: String })
  userId: string; // Usuario destinatario

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ required: true, type: String })
  templateType: string; // new_order_seller, order_confirmation_buyer, etc.

  @Prop({ 
    required: true, 
    enum: NotificationChannel,
    type: String 
  })
  channel: NotificationChannel;

  @Prop({ 
    required: true, 
    enum: NotificationPriority,
    type: String,
    default: NotificationPriority.MEDIUM
  })
  priority: NotificationPriority;

  @Prop({ 
    required: true, 
    enum: NotificationHistoryStatus,
    type: String,
    default: NotificationHistoryStatus.PENDING
  })
  status: NotificationHistoryStatus;

  @Prop({ required: true, type: String })
  subject: string; // Asunto del mensaje

  @Prop({ required: true, type: String })
  content: string; // Contenido del mensaje

  @Prop({ type: Object })
  eventData?: any; // Datos del evento original

  @Prop({ type: Number, default: 0 })
  attempts: number; // Número de intentos de envío

  @Prop({ type: String })
  errorMessage?: string; // Mensaje de error si falló

  @Prop({ type: Date })
  sentAt?: Date; // Fecha de envío exitoso

  @Prop({ type: Date })
  deliveredAt?: Date; // Fecha de entrega (para email)

  @Prop({ type: Date })
  readAt?: Date; // Fecha de lectura
}

export const NotificationHistorySchema = SchemaFactory.createForClass(NotificationHistory);

// Índices para optimizar consultas
NotificationHistorySchema.index({ userId: 1, createdAt: -1 });
NotificationHistorySchema.index({ eventId: 1 });
NotificationHistorySchema.index({ status: 1, priority: 1 });
NotificationHistorySchema.index({ eventType: 1, userId: 1 });
