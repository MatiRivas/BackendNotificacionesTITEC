import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

// Schemas
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationHistory, NotificationHistorySchema } from './schemas/notification-history.schema';
import { Template, TemplateSchema } from './schemas/template.schema';
import { ChannelType, ChannelTypeSchema } from './schemas/channel-type.schema';
import { TemplateType, TemplateTypeSchema } from './schemas/template-type.schema';

// Channel Services
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';
import { PushService } from './channels/push.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationHistory.name, schema: NotificationHistorySchema },
      { name: Template.name, schema: TemplateSchema },
      { name: ChannelType.name, schema: ChannelTypeSchema },
      { name: TemplateType.name, schema: TemplateTypeSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
  ],
  exports: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
  ],
})
export class NotificationsModule {}