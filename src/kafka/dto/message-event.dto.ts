import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class MessageReceivedEventDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderName: string;

  @IsEnum(['buyer', 'seller'])
  @IsNotEmpty()
  senderRole: 'buyer' | 'seller';

  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  messageContent: string;

  @IsString()
  @IsNotEmpty()
  messagePreview: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsString()
  @IsOptional()
  receiverEmail?: string;
}
