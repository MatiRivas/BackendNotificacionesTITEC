import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { KafkaService } from '../kafka.service';
import { NotificationsService } from '../../notificaciones/notifications.service';
import { PaymentIssueEventDto, RefundProcessedEventDto, DisputeOpenedEventDto } from '../dto/payment-issue-event.dto';

/**
 * 💸 Consumer para Problemas de Pago - HDU8
 * Maneja reembolsos, disputas, chargebacks y fraudes
 */
@Injectable()
export class PaymentIssueConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentIssueConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');
    
    // Suscribirse a todos los eventos de problemas de pago
    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.paymentIssues,
      this.handlePaymentIssue.bind(this),
    );

    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.refundsProcessed,
      this.handleRefundProcessed.bind(this),
    );

    await this.kafkaService.subscribeToTopic(
      kafkaConfig.topics.disputesOpened,
      this.handleDisputeOpened.bind(this),
    );

    this.logger.log('Payment Issue Consumer initialized and subscribed to topics');
  }

  /**
   * 💸 Maneja eventos generales de problemas de pago
   */
  private async handlePaymentIssue(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(
        `Processing payment issue event: ${eventData.issueId}, type: ${eventData.issueType}, ` +
        `status: ${eventData.status}`
      );

      // Validar el DTO
      const issueEvent = plainToClass(PaymentIssueEventDto, eventData);
      const errors = await validate(issueEvent);

      if (errors.length > 0) {
        this.logger.error('Payment issue event validation failed:', errors);
        throw new Error(`Invalid payment issue event data: ${errors.map(e => e.toString()).join(', ')}`);
      }

      // Determinar el tipo de notificación basado en el tipo de problema
      await this.routeIssueNotification(issueEvent);

      this.logger.log(`Successfully processed payment issue event: ${issueEvent.issueId}`);
    } catch (error) {
      this.logger.error('Error processing payment issue event:', error);
      throw error;
    }
  }

  /**
   * 🎯 Enruta la notificación según el tipo de problema
   */
  private async routeIssueNotification(issueEvent: PaymentIssueEventDto) {
    switch (issueEvent.issueType) {
      case 'refund_requested':
        await this.handleRefundRequested(issueEvent);
        break;
      case 'dispute_opened':
        await this.handleDisputeEvent(issueEvent);
        break;
      case 'chargeback_received':
        await this.handleChargebackReceived(issueEvent);
        break;
      case 'fraud_detected':
        await this.handleFraudDetected(issueEvent);
        break;
      default:
        this.logger.warn(`Unknown issue type: ${issueEvent.issueType}`);
    }
  }

  /**
   * 💰 Maneja solicitudes de reembolso
   */
  private async handleRefundRequested(issueEvent: PaymentIssueEventDto) {
    // Notificar al vendedor sobre la solicitud de reembolso
    await this.notificationsService.createNotificationFromEvent({
      eventType: 'refund_requested',
      eventData: {
        ...issueEvent,
        actionUrl: issueEvent.evidenceUrl || `/seller/refunds/${issueEvent.issueId}`,
        dueDate: issueEvent.dueDate,
        caseNumber: issueEvent.caseNumber
      },
      recipients: [{
        userId: issueEvent.sellerId,
        email: issueEvent.sellerEmail,
        role: 'seller'
      }],
      templateType: 'refund_requested_seller',
      channels: ['email', 'internal'],
      priority: this.determinePriority(issueEvent.priority),
    });
  }

  /**
   * ⚖️ Maneja eventos de disputa
   */
  private async handleDisputeEvent(issueEvent: PaymentIssueEventDto) {
    // Notificar al vendedor sobre la disputa - MUY URGENTE
    await this.notificationsService.createNotificationFromEvent({
      eventType: 'dispute_opened',
      eventData: {
        ...issueEvent,
        evidenceUrl: issueEvent.evidenceUrl,
        responseDeadline: issueEvent.dueDate,
        urgentAction: true
      },
      recipients: [{
        userId: issueEvent.sellerId,
        email: issueEvent.sellerEmail,
        role: 'seller'
      }],
      templateType: 'dispute_opened_seller',
      channels: ['email', 'sms', 'internal'], // Múltiples canales por urgencia
      priority: 'high',
    });
  }

  /**
   * 💳 Maneja chargebacks recibidos
   */
  private async handleChargebackReceived(issueEvent: PaymentIssueEventDto) {
    // Notificar al vendedor - CRÍTICO
    await this.notificationsService.createNotificationFromEvent({
      eventType: 'chargeback_received',
      eventData: {
        ...issueEvent,
        evidenceUrl: issueEvent.evidenceUrl,
        responseDeadline: issueEvent.dueDate,
        criticalAction: true
      },
      recipients: [{
        userId: issueEvent.sellerId,
        email: issueEvent.sellerEmail,
        role: 'seller'
      }],
      templateType: 'chargeback_received_seller',
      channels: ['email', 'sms', 'push', 'internal'], // Todos los canales
      priority: 'high',
    });
  }

  /**
   * 🚨 Maneja detección de fraude
   */
  private async handleFraudDetected(issueEvent: PaymentIssueEventDto) {
    // Notificar al vendedor sobre fraude detectado
    await this.notificationsService.createNotificationFromEvent({
      eventType: 'fraud_detected',
      eventData: {
        ...issueEvent,
        immediateAction: true,
        securityAlert: true
      },
      recipients: [{
        userId: issueEvent.sellerId,
        email: issueEvent.sellerEmail,
        role: 'seller'
      }],
      templateType: 'fraud_detected_seller',
      channels: ['email', 'sms', 'internal'],
      priority: 'high',
    });
  }

  /**
   * ✅ Maneja reembolsos procesados exitosamente
   */
  private async handleRefundProcessed(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing refund processed event: ${eventData.refundId}`);

      const refundEvent = plainToClass(RefundProcessedEventDto, eventData);
      const errors = await validate(refundEvent);

      if (errors.length > 0) {
        this.logger.error('Refund processed event validation failed:', errors);
        throw new Error(`Invalid refund processed event data: ${errors.map(e => e.toString()).join(', ')}`);
      }

      // Notificar al comprador que su reembolso fue procesado
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'refund_processed',
        eventData: {
          ...refundEvent,
          expectedInAccount: refundEvent.expectedInAccount
        },
        recipients: [{
          userId: refundEvent.buyerId,
          email: refundEvent.buyerEmail,
          role: 'buyer'
        }],
        templateType: 'refund_processed_buyer',
        channels: ['email', 'internal'],
        priority: 'medium',
      });

      // También notificar al vendedor
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'refund_processed',
        eventData: refundEvent,
        recipients: [{
          userId: refundEvent.sellerId,
          email: refundEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'refund_processed_seller',
        channels: ['email', 'internal'],
        priority: 'medium',
      });

      this.logger.log(`Successfully processed refund processed event: ${refundEvent.refundId}`);
    } catch (error) {
      this.logger.error('Error processing refund processed event:', error);
      throw error;
    }
  }

  /**
   * ⚖️ Maneja disputas abiertas específicas
   */
  private async handleDisputeOpened(message: any, topic: string, partition: number) {
    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Processing dispute opened event: ${eventData.disputeId}`);

      const disputeEvent = plainToClass(DisputeOpenedEventDto, eventData);
      const errors = await validate(disputeEvent);

      if (errors.length > 0) {
        this.logger.error('Dispute opened event validation failed:', errors);
        throw new Error(`Invalid dispute opened event data: ${errors.map(e => e.toString()).join(', ')}`);
      }

      // Notificar al vendedor - MUY URGENTE con deadline
      await this.notificationsService.createNotificationFromEvent({
        eventType: 'dispute_opened_urgent',
        eventData: {
          ...disputeEvent,
          hoursUntilDeadline: this.calculateHoursUntilDeadline(disputeEvent.responseDeadline),
          actionRequired: 'upload_evidence'
        },
        recipients: [{
          userId: disputeEvent.sellerId,
          email: disputeEvent.sellerEmail,
          role: 'seller'
        }],
        templateType: 'dispute_opened_urgent_seller',
        channels: ['email', 'sms', 'internal'], // Múltiples canales por urgencia
        priority: 'high',
      });

      this.logger.log(`Successfully processed dispute opened event: ${disputeEvent.disputeId}`);
    } catch (error) {
      this.logger.error('Error processing dispute opened event:', error);
      throw error;
    }
  }

  /**
   * 🎯 Determina la prioridad basada en el string de prioridad
   */
  private determinePriority(priority?: string): 'low' | 'medium' | 'high' {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      default:
        return 'medium';
    }
  }

  /**
   * ⏰ Calcula horas hasta deadline
   */
  private calculateHoursUntilDeadline(deadline: string): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  }
}