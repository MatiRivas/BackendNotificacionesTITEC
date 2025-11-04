import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersApiService } from './users-api.service';

@Module({
  imports: [HttpModule],
  providers: [UsersApiService],
  exports: [UsersApiService],
})
export class ExternalModule {}