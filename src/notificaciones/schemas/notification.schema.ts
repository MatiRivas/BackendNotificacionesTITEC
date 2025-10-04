import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface NotificationDocument extends Notification, Document {
  id: string;
}

// Enum para el estado
export enum NotificationStatus {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  RECIBIDO = 'recibido',
  LEIDO = 'leido',
  FALLIDO = 'fallido',
}

@Schema({
  collection: 'notificaciones', // ⬅️ Nombre exacto de tu colección en Compass
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
export class Notification {
  @Prop({ required: true, type: Number }) // INT en tu diccionario
  id_notificacion: number;

  @Prop({ required: true, type: Date }) // TIMESTAMP
  fecha_hora: Date;

  @Prop({ required: true, type: Number })
  id_emisor: number; // Usuario que envía

  @Prop({ required: true, type: Number })
  id_receptor: number; // Usuario que recibe

  @Prop({ required: true, type: Number })
  id_plantilla: number; // FK a Plantillas

  // ✅ EMBEDDING - Array de canales (reemplaza tabla intermedia)
  @Prop({ type: [Number], required: true })
  channel_ids: number[]; // Array de IDs de canales

  @Prop({ 
    required: true, 
    enum: NotificationStatus,
    type: String 
  })
  estado: NotificationStatus;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Índices para optimizar consultas
NotificationSchema.index({ id_receptor: 1, fecha_hora: -1 });
NotificationSchema.index({ id_receptor: 1, estado: 1 });
NotificationSchema.index({ id_notificacion: 1 }, { unique: true });