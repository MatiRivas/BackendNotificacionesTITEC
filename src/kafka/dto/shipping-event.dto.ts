import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class OrderShippedEventDto {
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
  trackingNumber: string;

  @IsString()
  @IsNotEmpty()
  shippingCompany: string; // 'correos_chile', 'chilexpress', 'starken', etc.

  @IsDateString()
  shippedAt: string;

  @IsDateString()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}

export class OrderDeliveredEventDto {
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
  trackingNumber: string;

  @IsDateString()
  deliveredAt: string;

  @IsString()
  @IsOptional()
  receivedBy?: string; // Nombre de quien recibió el paquete

  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}
