import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ExternalModule } from '../external/external.module';

// Schemas
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Template, TemplateSchema, TemplateType, TemplateTypeSchema } from './schemas/template.schema';
import { Channel, ChannelSchema } from './schemas/channel.schema';

// Channel Services
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';
import { PushService } from './channels/push.service';
import { InternalNotificationService } from './channels/internal.service';

// Services
import { FallbackService } from './services/fallback.service';
import { ChannelManagerService } from './services/channel-manager.service';

@Module({
  imports: [
    ConfigModule,
    ExternalModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: TemplateType.name, schema: TemplateTypeSchema },
      { name: Channel.name, schema: ChannelSchema },
    ]),
  ],
  controllers: [
    NotificationsController,
  ],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
    InternalNotificationService,
    FallbackService,
    ChannelManagerService,
  ],
  exports: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
    InternalNotificationService,
    FallbackService,
    ChannelManagerService,
  ],
})
export class NotificationsModule {}