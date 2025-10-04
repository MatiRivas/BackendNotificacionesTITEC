import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface TemplateTypeDocument extends TemplateType, Document {
  id: string;
}

@Schema({
  collection: 'tipo_plantillas',
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
export class TemplateType {
  @Prop({ required: true, type: Number })
  id_tipo_plantilla: number;

  @Prop({ required: true, type: String, maxlength: 100 })
  tipo_plantilla: string; // 'Transaccional', 'Promocional', 'Sistema'
}

export const TemplateTypeSchema = SchemaFactory.createForClass(TemplateType);

TemplateTypeSchema.index({ id_tipo_plantilla: 1 }, { unique: true });