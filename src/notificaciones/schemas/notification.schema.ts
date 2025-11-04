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
  collection: 'notificaciones', // ⬅️ Usa la colección existente
  timestamps: false, // Tu BD no tiene createdAt/updatedAt automáticos
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
  @Prop({ required: true, type: Number })
  id_notificacion: number;

  @Prop({ required: true, type: Date })
  fecha_hora: Date;

  @Prop({ required: true, type: String })
  id_emisor: string; // UUID del microservicio Users

  @Prop({ required: true, type: String })
  id_receptor: string; // UUID del microservicio Users

  @Prop({ required: true, type: Number })
  id_plantilla: number; // FK a Plantillas

  // Array de IDs de canales (adaptado a tu estructura)
  @Prop({ type: [Number], required: true })
  channel_ids: number[];

  @Prop({ 
    required: true, 
    enum: NotificationStatus,
    type: String 
  })
  estado: NotificationStatus;

  // ⬇️ ===== NUEVO CAMPO PARA SPRINT 2 ===== ⬇️
  @Prop({ 
    type: Object, 
    default: {} 
  })
  metadata: {
    // Para notificaciones de pago
    monto?: number;
    tipo_problema?: string;        // 'rechazado', 'reembolso', 'disputa'
    accion_requerida?: string;     // 'reintentar_pago', 'subir_evidencia', 'contactar_soporte'
    motivo_cancelacion?: string;
    link_soporte?: string; 
    orden_id?: string;              // ✅ Para referencia al microservicio de órdenes
    estado_pedido?: string;        // ✅ Referencia para el microservicio de órdenes también

    
    // Extensible para futuros casos de uso
    [key: string]: any;
  };
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Índices para optimizar consultas
NotificationSchema.index({ id_receptor: 1, fecha_hora: -1 });
NotificationSchema.index({ id_receptor: 1, estado: 1 });
NotificationSchema.index({ id_notificacion: 1 }, { unique: true });