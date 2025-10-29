import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserPreferences, UserPreferencesDocument } from '../schemas/user-preferences.schema';
import { CreateUserPreferencesDto, UpdateUserPreferencesDto, UserPreferencesResponseDto } from '../dto/user-preferences.dto';

/**
 * 👤 Servicio de Preferencias de Usuario
 * Implementa HDU7: Gestión de preferencias de notificación por usuario
 */
@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(
    @InjectModel(UserPreferences.name)
    private userPreferencesModel: Model<UserPreferencesDocument>,
  ) {}

  /**
   * 🆕 Crea preferencias por defecto para un nuevo usuario
   * @param createDto - Datos para crear preferencias
   * @returns Promise<UserPreferencesResponseDto>
   */
  async createDefaultPreferences(createDto: CreateUserPreferencesDto): Promise<UserPreferencesResponseDto> {
    try {
      // Verificar si ya existen preferencias para este usuario
      const existingPreferences = await this.userPreferencesModel.findOne({ 
        userId: createDto.userId 
      });

      if (existingPreferences) {
        this.logger.log(`Preferences already exist for user ${createDto.userId}, returning existing`);
        return this.mapToResponseDto(existingPreferences);
      }

      // Crear nuevas preferencias con valores por defecto
      const defaultPreferences = new this.userPreferencesModel({
        userId: createDto.userId,
        preferredChannels: createDto.preferredChannels || ['email', 'internal'],
        enableNotifications: createDto.enableNotifications ?? true,
        channelSettings: createDto.channelSettings || {
          email: { enabled: true },
          internal: { enabled: true }
        },
        notificationTypes: createDto.notificationTypes || ['order', 'payment', 'shipping'],
        lastUpdated: new Date()
      });

      const savedPreferences = await defaultPreferences.save();
      
      this.logger.log(`Created default preferences for user ${createDto.userId}`);
      return this.mapToResponseDto(savedPreferences);
    } catch (error) {
      this.logger.error(`Error creating default preferences for user ${createDto.userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * 📖 Obtiene las preferencias de un usuario
   * @param userId - ID del usuario
   * @returns Promise<UserPreferencesResponseDto>
   */
  async getUserPreferences(userId: string): Promise<UserPreferencesResponseDto> {
    try {
      const preferences = await this.userPreferencesModel.findOne({ userId });

      if (!preferences) {
        // Si no existen preferencias, crear las por defecto
        this.logger.log(`No preferences found for user ${userId}, creating default ones`);
        return this.createDefaultPreferences({ userId });
      }

      return this.mapToResponseDto(preferences);
    } catch (error) {
      this.logger.error(`Error getting preferences for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * ✏️ Actualiza las preferencias de un usuario
   * @param userId - ID del usuario
   * @param updateDto - Datos para actualizar
   * @returns Promise<UserPreferencesResponseDto>
   */
  async updateUserPreferences(
    userId: string, 
    updateDto: UpdateUserPreferencesDto
  ): Promise<UserPreferencesResponseDto> {
    try {
      const updateData = {
        ...updateDto,
        lastUpdated: new Date()
      };

      const updatedPreferences = await this.userPreferencesModel.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedPreferences) {
        // Si no existen preferencias, crear nuevas con los datos actualizados
        this.logger.log(`No preferences found for user ${userId}, creating new ones with updates`);
        return this.createDefaultPreferences({ 
          userId, 
          ...updateDto 
        });
      }

      this.logger.log(`Updated preferences for user ${userId}`);
      return this.mapToResponseDto(updatedPreferences);
    } catch (error) {
      this.logger.error(`Error updating preferences for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * 🗑️ Elimina las preferencias de un usuario (GDPR compliance)
   * @param userId - ID del usuario
   * @returns Promise<boolean>
   */
  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      const result = await this.userPreferencesModel.deleteOne({ userId });
      
      if (result.deletedCount === 0) {
        this.logger.warn(`No preferences found to delete for user ${userId}`);
        return false;
      }

      this.logger.log(`Deleted preferences for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting preferences for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * 🔍 Verifica si un usuario tiene notificaciones habilitadas
   * @param userId - ID del usuario
   * @returns Promise<boolean>
   */
  async areNotificationsEnabled(userId: string): Promise<boolean> {
    try {
      const preferences = await this.userPreferencesModel.findOne(
        { userId },
        { enableNotifications: 1 }
      );

      // Si no hay preferencias, asumir que están habilitadas por defecto
      return preferences?.enableNotifications ?? true;
    } catch (error) {
      this.logger.error(`Error checking notifications enabled for user ${userId}:`, error.stack);
      // En caso de error, permitir notificaciones por seguridad
      return true;
    }
  }

  /**
   * 📡 Obtiene los canales preferidos de un usuario
   * @param userId - ID del usuario
   * @returns Promise<string[]>
   */
  async getPreferredChannels(userId: string): Promise<string[]> {
    try {
      const preferences = await this.userPreferencesModel.findOne(
        { userId },
        { preferredChannels: 1 }
      );

      return preferences?.preferredChannels || ['email', 'internal'];
    } catch (error) {
      this.logger.error(`Error getting preferred channels for user ${userId}:`, error.stack);
      // En caso de error, devolver canales por defecto
      return ['email', 'internal'];
    }
  }

  /**
   * 🎯 Verifica si un usuario quiere recibir un tipo específico de notificación
   * @param userId - ID del usuario
   * @param notificationType - Tipo de notificación (order, payment, shipping, general)
   * @returns Promise<boolean>
   */
  async wantsNotificationType(userId: string, notificationType: string): Promise<boolean> {
    try {
      const preferences = await this.userPreferencesModel.findOne(
        { userId },
        { notificationTypes: 1, enableNotifications: 1 }
      );

      if (!preferences?.enableNotifications) {
        return false;
      }

      const allowedTypes = preferences?.notificationTypes || ['order', 'payment', 'shipping'];
      return allowedTypes.includes(notificationType);
    } catch (error) {
      this.logger.error(`Error checking notification type preference for user ${userId}:`, error.stack);
      // En caso de error, permitir la notificación
      return true;
    }
  }

  /**
   * 📊 Obtiene estadísticas de preferencias de usuarios
   * @returns Promise<object>
   */
  async getPreferencesStats(): Promise<{
    totalUsers: number;
    enabledNotifications: number;
    disabledNotifications: number;
    channelDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
  }> {
    try {
      const [stats] = await this.userPreferencesModel.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            enabledNotifications: {
              $sum: { $cond: ['$enableNotifications', 1, 0] }
            },
            disabledNotifications: {
              $sum: { $cond: ['$enableNotifications', 0, 1] }
            },
            allChannels: { $push: '$preferredChannels' },
            allTypes: { $push: '$notificationTypes' }
          }
        }
      ]);

      // Calcular distribución de canales
      const channelDistribution = {};
      stats?.allChannels?.flat().forEach(channel => {
        channelDistribution[channel] = (channelDistribution[channel] || 0) + 1;
      });

      // Calcular distribución de tipos
      const typeDistribution = {};
      stats?.allTypes?.flat().forEach(type => {
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });

      return {
        totalUsers: stats?.totalUsers || 0,
        enabledNotifications: stats?.enabledNotifications || 0,
        disabledNotifications: stats?.disabledNotifications || 0,
        channelDistribution,
        typeDistribution
      };
    } catch (error) {
      this.logger.error('Error getting preferences stats:', error.stack);
      return {
        totalUsers: 0,
        enabledNotifications: 0,
        disabledNotifications: 0,
        channelDistribution: {},
        typeDistribution: {}
      };
    }
  }

  /**
   * 🗂️ Mapea documento de MongoDB a DTO de respuesta
   * @param preferences - Documento de preferencias
   * @returns UserPreferencesResponseDto
   */
  private mapToResponseDto(preferences: UserPreferencesDocument): UserPreferencesResponseDto {
    return {
      userId: preferences.userId,
      preferredChannels: preferences.preferredChannels,
      enableNotifications: preferences.enableNotifications,
      channelSettings: preferences.channelSettings,
      notificationTypes: preferences.notificationTypes,
      lastUpdated: preferences.lastUpdated
    };
  }

  /**
   * 🧹 Limpia preferencias de usuarios inactivos (más de 1 año sin actualizar)
   * @returns Promise<number> - Número de preferencias eliminadas
   */
  async cleanupInactivePreferences(): Promise<number> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = await this.userPreferencesModel.deleteMany({
        lastUpdated: { $lt: oneYearAgo }
      });

      this.logger.log(`Cleanup completed: ${result.deletedCount} inactive preferences removed`);
      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error('Error in cleanup of inactive preferences:', error.stack);
      return 0;
    }
  }
}