import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserPreferencesDocument = UserPreferences & Document;

/**
 * 📋 Schema para las preferencias de notificación de usuarios
 * Implementa HDU7: "El comprador puede elegir el canal de notificación preferido"
 */
@Schema({
  timestamps: true,
  collection: 'user_preferences'
})
export class UserPreferences {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ 
    type: [String], 
    enum: ['email', 'sms', 'push', 'internal'],
    default: ['email', 'internal']
  })
  preferredChannels: string[];

  @Prop({ default: true })
  enableNotifications: boolean;

  @Prop({ 
    type: Object,
    default: {}
  })
  channelSettings: {
    email?: {
      address?: string;
      verified?: boolean;
    };
    sms?: {
      phoneNumber?: string;
      verified?: boolean;
    };
    push?: {
      deviceTokens?: string[];
      enabled?: boolean;
    };
    internal?: {
      enabled?: boolean;
    };
  };

  @Prop({ 
    type: [String],
    enum: ['order', 'payment', 'shipping', 'general'],
    default: ['order', 'payment', 'shipping']
  })
  notificationTypes: string[];

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

// Índices para optimizar consultas
UserPreferencesSchema.index({ userId: 1 });
UserPreferencesSchema.index({ userId: 1, enableNotifications: 1 });