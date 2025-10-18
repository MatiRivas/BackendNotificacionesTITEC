import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class PaymentConfirmedEventDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

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
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // 'credit_card', 'debit_card', 'transfer', etc.

  @IsString()
  @IsNotEmpty()
  status: string; // 'confirmed', 'failed', 'pending'

  @IsDateString()
  confirmedAt: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}

export class PaymentFailedEventDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

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
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  errorCode: string;

  @IsString()
  @IsNotEmpty()
  errorMessage: string;

  @IsDateString()
  failedAt: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}

/**
 * 🚫 DTO para pagos rechazados - HDU6
 * Implementa notificación específica para compradores cuando su pago es rechazado
 */
export class PaymentRejectedEventDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

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
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  rejectionReason: string; // 'insufficient_funds', 'invalid_card', 'fraud_detected'

  @IsString()
  @IsNotEmpty()
  rejectionCode: string;

  @IsDateString()
  rejectedAt: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;

  @IsString()
  @IsOptional()
  retryAllowed?: string; // 'yes', 'no', 'limited'

  @IsString()
  @IsOptional()
  suggestedActions?: string; // JSON string con acciones sugeridas
}
