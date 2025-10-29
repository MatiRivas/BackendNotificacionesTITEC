import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum } from 'class-validator';

export class NotificationRecipient {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['buyer', 'seller', 'admin'])
  role: 'buyer' | 'seller' | 'admin';
}

export class CreateNotificationFromEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsNotEmpty()
  eventData: any;

  @IsArray()
  recipients: NotificationRecipient[];

  @IsString()
  @IsNotEmpty()
  templateType: string;

  @IsArray()
  @IsOptional()
  channels?: string[];

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high';
}
