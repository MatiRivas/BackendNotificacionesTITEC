import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersApiService } from './users-api.service';
import { EventsListenerService } from './events-listener.service';
import { NotificationsModule } from '../notificaciones/notifications.module';

@Module({
  imports: [HttpModule, forwardRef(() => NotificationsModule)],
  providers: [UsersApiService, EventsListenerService],
  exports: [UsersApiService, EventsListenerService],
})
export class ExternalModule {}