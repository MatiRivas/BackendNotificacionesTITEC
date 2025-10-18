import { Controller, Get, Put, Patch, Param, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { UserPreferencesService } from './services/user-preferences.service';
import { InternalNotificationService } from './channels/internal.service';
import { UpdateUserPreferencesDto, UserPreferencesResponseDto } from './dto/user-preferences.dto';

/**
 * 🎛️ Controller de Preferencias de Notificación
 * Implementa los 4 nuevos endpoints requeridos por el Sprint 2
 */
@Controller('notifications')
export class PreferencesController {
  private readonly logger = new Logger(PreferencesController.name);

  constructor(
    private readonly userPreferencesService: UserPreferencesService,
    private readonly internalService: InternalNotificationService,
  ) {}

  /**
   * 📖 GET /notifications/user/:userId/preferences
   * Obtiene las preferencias de notificación de un usuario
   */
  @Get('user/:userId/preferences')
  async getUserPreferences(@Param('userId') userId: string): Promise<UserPreferencesResponseDto> {
    this.logger.log(`Getting preferences for user: ${userId}`);
    
    try {
      return await this.userPreferencesService.getUserPreferences(userId);
    } catch (error) {
      this.logger.error(`Error getting preferences for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * ✏️ PUT /notifications/user/:userId/preferences
   * Actualiza las preferencias de notificación de un usuario
   */
  @Put('user/:userId/preferences')
  @HttpCode(HttpStatus.OK)
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserPreferencesDto
  ): Promise<UserPreferencesResponseDto> {
    this.logger.log(`Updating preferences for user: ${userId}`);
    
    try {
      return await this.userPreferencesService.updateUserPreferences(userId, updateDto);
    } catch (error) {
      this.logger.error(`Error updating preferences for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * 📱 GET /notifications/user/:userId/internal
   * Obtiene notificaciones internas no leídas de un usuario
   */
  @Get('user/:userId/internal')
  async getInternalNotifications(@Param('userId') userId: string) {
    this.logger.log(`Getting internal notifications for user: ${userId}`);
    
    try {
      return await this.internalService.getUnreadInternalNotifications(userId);
    } catch (error) {
      this.logger.error(`Error getting internal notifications for user ${userId}:`, error.stack);
      throw error;
    }
  }

  /**
   * ✅ PATCH /notifications/:id/read
   * Marca una notificación como leída
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markNotificationAsRead(
    @Param('id') notificationId: string,
    @Body() body: { userId: string; readAt?: string }
  ) {
    this.logger.log(`Marking notification ${notificationId} as read for user: ${body.userId}`);
    
    try {
      const success = await this.internalService.markAsRead(notificationId, body.userId);
      
      if (!success) {
        return {
          success: false,
          message: 'Notification not found or already read'
        };
      }

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      this.logger.error(`Error marking notification ${notificationId} as read:`, error.stack);
      throw error;
    }
  }

  /**
   * 📊 GET /notifications/user/:userId/stats
   * Obtiene estadísticas de notificaciones para un usuario (endpoint adicional útil)
   */
  @Get('user/:userId/stats')
  async getUserNotificationStats(@Param('userId') userId: string) {
    this.logger.log(`Getting notification stats for user: ${userId}`);
    
    try {
      const [internalStats, preferences] = await Promise.all([
        this.internalService.getStats(userId),
        this.userPreferencesService.getUserPreferences(userId)
      ]);

      return {
        internal: internalStats,
        preferences: {
          enabledChannels: preferences.preferredChannels,
          notificationsEnabled: preferences.enableNotifications,
          lastUpdated: preferences.lastUpdated
        }
      };
    } catch (error) {
      this.logger.error(`Error getting stats for user ${userId}:`, error.stack);
      throw error;
    }
  }
}