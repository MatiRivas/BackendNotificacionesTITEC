import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface TemplateDocument extends Template, Document {
  id: string;
}

@Schema({
  collection: 'plantillas',
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
export class Template {
  @Prop({ required: true, type: Number })
  id_Plantilla: number;

  @Prop({ required: true, type: Number })
  id_canal: number; // FK a Tipo_Canales

  @Prop({ required: true, type: Number })
  id_tipo_plantilla: number; // FK a Tipo_Plantillas

  @Prop({ required: true, type: String, maxlength: 500 })
  descripción_base: string;

  @Prop({ required: true, type: String, maxlength: 200 })
  asunto_base: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

TemplateSchema.index({ id_Plantilla: 1 }, { unique: true });