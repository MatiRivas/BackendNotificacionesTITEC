import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface ChannelDocument extends Channel, Document {
  id: string;
}

@Schema({
  collection: 'tipo_canales', // ⬅️ Usa tu colección existente
  timestamps: false,
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
export class Channel {
  @Prop({ required: true, type: Number })
  id_canal: number;

  @Prop({ required: true, type: String })
  tipo_canal: string; // "Email", "SMS", "push"
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

// Índices
ChannelSchema.index({ id_canal: 1 }, { unique: true });
ChannelSchema.index({ tipo_canal: 1 });