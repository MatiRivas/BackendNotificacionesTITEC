import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface ChannelTypeDocument extends ChannelType, Document {
  id: string;
}

@Schema({
  collection: 'tipo_canales',
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
export class ChannelType {
  @Prop({ required: true, type: Number })
  id_canal: number;

  @Prop({ required: true, type: String, maxlength: 30 })
  tipo_canal: string; // 'SMS', 'push', 'email'
}

export const ChannelTypeSchema = SchemaFactory.createForClass(ChannelType);

ChannelTypeSchema.index({ id_canal: 1 }, { unique: true });