import { IsString, IsNotEmpty, IsDateString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class OrderCreatedEventDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsNumber()
  totalAmount: number;

  @IsDateString()
  createdAt: string;

  @IsArray()
  @IsOptional()
  products?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}

export class OrderStatusChangedEventDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  previousStatus: string;

  @IsString()
  @IsNotEmpty()
  newStatus: string; // 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'

  @IsDateString()
  updatedAt: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string; // Para cuando esté enviado
}

export class OrderCancelledEventDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  cancelledBy: string; // 'buyer' | 'seller' | 'system'

  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsDateString()
  cancelledAt: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}
