import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface TemplateDocument extends Template, Document {
  id: string;
}

export interface TemplateTypeDocument extends TemplateType, Document {
  id: string;
}

@Schema({
  collection: 'plantillas', // ⬅️ Usa tu colección existente
  timestamps: false, // Tu BD actual no tiene timestamps automáticos
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
  id_tipo_plantilla: number; // FK a tipo_plantillas

  @Prop({ required: true, type: String })
  descripción_base: string;

  @Prop({ required: false, type: String })
  asunto_base?: string; // Opcional, no todas las plantillas tienen asunto
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

TemplateSchema.index({ id_Plantilla: 1 }, { unique: true });
TemplateSchema.index({ id_tipo_plantilla: 1 });

// Esquema para tipo_plantillas
@Schema({
  collection: 'tipo_plantillas', // ⬅️ Tu colección existente
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
export class TemplateType {
  @Prop({ required: true, type: Number })
  id_tipo_plantilla: number;

  @Prop({ required: true, type: String })
  tipo_plantilla: string;
}

export const TemplateTypeSchema = SchemaFactory.createForClass(TemplateType);

TemplateTypeSchema.index({ id_tipo_plantilla: 1 }, { unique: true });