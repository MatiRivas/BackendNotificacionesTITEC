import { IsString, IsNumber, IsArray, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  id_emisor: string;

  @IsString()
  id_receptor: string;

  @IsNumber()
  id_plantilla: number;

  @IsArray()
  @IsNumber({}, { each: true })
  channel_ids: number[];

  @IsOptional()
  context?: any;

  @IsOptional()
  @IsObject()
  metadata?: {
    // Para notificaciones de pago
    monto?: number;
    tipo_problema?: string;        // 'rechazado', 'reembolso', 'disputa'
    accion_requerida?: string;     // 'reintentar_pago', 'subir_evidencia', 'contactar_soporte'
  };
}