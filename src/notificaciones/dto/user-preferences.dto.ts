import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 📝 DTO para actualizar preferencias de usuario
 * Implementa HDU7: Configuración de canales de notificación
 */
export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsArray()
  @IsEnum(['email', 'sms', 'push', 'internal'], { each: true })
  preferredChannels?: string[];

  @IsOptional()
  @IsBoolean()
  enableNotifications?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ChannelSettingsDto)
  channelSettings?: ChannelSettingsDto;

  @IsOptional()
  @IsArray()
  @IsEnum(['order', 'payment', 'shipping', 'general'], { each: true })
  notificationTypes?: string[];
}

/**
 * 📝 DTO para obtener preferencias de usuario (respuesta)
 */
export class UserPreferencesResponseDto {
  userId: string;
  preferredChannels: string[];
  enableNotifications: boolean;
  channelSettings: ChannelSettingsDto;
  notificationTypes: string[];
  lastUpdated: Date;
}

/**
 * 📝 DTO para configuraciones específicas de cada canal
 */
export class ChannelSettingsDto {
  @IsOptional()
  @IsObject()
  email?: {
    address?: string;
    verified?: boolean;
  };

  @IsOptional()
  @IsObject()
  sms?: {
    phoneNumber?: string;
    verified?: boolean;
  };

  @IsOptional()
  @IsObject()
  push?: {
    deviceTokens?: string[];
    enabled?: boolean;
  };

  @IsOptional()
  @IsObject()
  internal?: {
    enabled?: boolean;
  };
}

/**
 * 📝 DTO para crear preferencias de usuario por defecto
 */
export class CreateUserPreferencesDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsArray()
  @IsEnum(['email', 'sms', 'push', 'internal'], { each: true })
  preferredChannels?: string[] = ['email', 'internal'];

  @IsOptional()
  @IsBoolean()
  enableNotifications?: boolean = true;

  @IsOptional()
  @IsObject()
  channelSettings?: ChannelSettingsDto = {};

  @IsOptional()
  @IsArray()
  @IsEnum(['order', 'payment', 'shipping', 'general'], { each: true })
  notificationTypes?: string[] = ['order', 'payment', 'shipping'];
}