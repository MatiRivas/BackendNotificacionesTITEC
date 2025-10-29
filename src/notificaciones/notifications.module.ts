import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PreferencesController } from './preferences.controller'; // Nuevo - Sprint 2

// Schemas
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationHistory, NotificationHistorySchema } from './schemas/notification-history.schema';
import { Template, TemplateSchema } from './schemas/template.schema';
import { ChannelType, ChannelTypeSchema } from './schemas/channel-type.schema';
import { TemplateType, TemplateTypeSchema } from './schemas/template-type.schema';
import { UserPreferences, UserPreferencesSchema } from './schemas/user-preferences.schema'; // Nuevo - Sprint 2
import { NotificationActions, NotificationActionsSchema } from './schemas/notification-actions.schema'; // Nuevo - Sprint 2

// Channel Services
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';
import { PushService } from './channels/push.service';
import { InternalNotificationService } from './channels/internal.service'; // Nuevo - Sprint 2

// New Services - Sprint 2
import { UserPreferencesService } from './services/user-preferences.service';
import { FallbackService } from './services/fallback.service';
import { ChannelManagerService } from './services/channel-manager.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationHistory.name, schema: NotificationHistorySchema },
      { name: Template.name, schema: TemplateSchema },
      { name: ChannelType.name, schema: ChannelTypeSchema },
      { name: TemplateType.name, schema: TemplateTypeSchema },
      { name: UserPreferences.name, schema: UserPreferencesSchema }, // Nuevo - Sprint 2
      { name: NotificationActions.name, schema: NotificationActionsSchema }, // Nuevo - Sprint 2
    ]),
  ],
  controllers: [
    NotificationsController,
    PreferencesController, // Nuevo - Sprint 2
  ],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
    InternalNotificationService, // Nuevo - Sprint 2
    UserPreferencesService, // Nuevo - Sprint 2
    FallbackService, // Nuevo - Sprint 2
    ChannelManagerService, // Nuevo - Sprint 2
  ],
  exports: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
    InternalNotificationService, // Nuevo - Sprint 2
    UserPreferencesService, // Nuevo - Sprint 2
    FallbackService, // Nuevo - Sprint 2
    ChannelManagerService, // Nuevo - Sprint 2
  ],
})
export class NotificationsModule {}