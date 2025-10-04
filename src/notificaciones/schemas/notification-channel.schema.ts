import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface NotificationChannelDocument extends NotificationChannel, Document {
  id: string;
}

@Schema({
  collection: 'notificaciones_canales',
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
export class NotificationChannel {
  @Prop({ required: true, type: Number })
  id_notificacion: number; // FK

  @Prop({ required: true, type: Number })
  id_plantilla: number; // FK
}

export const NotificationChannelSchema = SchemaFactory.createForClass(NotificationChannel);

NotificationChannelSchema.index({ id_notificacion: 1, id_plantilla: 1 });