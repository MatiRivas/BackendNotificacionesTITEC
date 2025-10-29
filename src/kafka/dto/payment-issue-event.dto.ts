import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, IsEnum } from 'class-validator';

/**
 * 💸 DTO para eventos de problemas de pago - HDU8
 * Maneja reembolsos, disputas y otros problemas complejos de pago
 */
export class PaymentIssueEventDto {
  @IsString()
  @IsNotEmpty()
  issueId: string;

  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsEnum(['refund_requested', 'refund_processed', 'dispute_opened', 'chargeback_received', 'fraud_detected'])
  issueType: 'refund_requested' | 'refund_processed' | 'dispute_opened' | 'chargeback_received' | 'fraud_detected';

  @IsEnum(['pending', 'in_progress', 'resolved', 'escalated', 'closed'])
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated' | 'closed';

  @IsNumber()
  originalAmount: number;

  @IsNumber()
  @IsOptional()
  affectedAmount?: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  reportedAt: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string; // Fecha límite para responder

  @IsString()
  @IsOptional()
  evidenceUrl?: string; // URL para subir evidencia

  @IsString()
  @IsOptional()
  caseNumber?: string; // Número de caso del proveedor de pagos

  @IsString()
  @IsOptional()
  sellerEmail?: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  priority?: string; // 'low', 'medium', 'high', 'critical'

  @IsString()
  @IsOptional()
  actionRequired?: string; // JSON string con acciones específicas
}

/**
 * 🔄 DTO para refund procesado exitosamente
 */
export class RefundProcessedEventDto {
  @IsString()
  @IsNotEmpty()
  refundId: string;

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
  refundAmount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsDateString()
  processedAt: string;

  @IsDateString()
  @IsOptional()
  expectedInAccount?: string; // Cuándo llegará el dinero a la cuenta

  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}

/**
 * ⚠️ DTO para disputas abiertas
 */
export class DisputeOpenedEventDto {
  @IsString()
  @IsNotEmpty()
  disputeId: string;

  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsNumber()
  disputeAmount: number;

  @IsString()
  @IsNotEmpty()
  disputeReason: string;

  @IsString()
  @IsOptional()
  buyerMessage?: string;

  @IsDateString()
  openedAt: string;

  @IsDateString()
  responseDeadline: string; // Deadline para responder (crítico)

  @IsString()
  @IsNotEmpty()
  evidenceUrl: string; // URL donde subir evidencia

  @IsString()
  @IsOptional()
  caseNumber?: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;

  @IsString()
  @IsOptional()
  buyerEmail?: string;
}