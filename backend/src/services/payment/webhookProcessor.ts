import { prisma } from '../../lib/prisma'
import { PaymentGatewayService } from './PaymentGatewayService'
import { WebhookEvent, PaymentStatus, SubscriptionStatus } from './types'
import { AuditAction } from '@prisma/client'

/**
 * Processador de webhooks com idempotência
 */
export class WebhookProcessor {
  /**
   * Processa um evento de webhook de forma idempotente
   */
  static async processEvent(
    gatewayProvider: string,
    gatewayEventId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    // Verificar se evento já foi processado
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        gatewayProvider_gatewayEventId: {
          gatewayProvider,
          gatewayEventId,
        },
      },
    })

    if (existingEvent && existingEvent.processed) {
      return
    }

    // Registrar evento
    const webhookEvent = await prisma.webhookEvent.upsert({
      where: {
        gatewayProvider_gatewayEventId: {
          gatewayProvider,
          gatewayEventId,
        },
      },
      create: {
        id: `${gatewayProvider}_${gatewayEventId}`,
        gatewayProvider,
        gatewayEventId,
        eventType,
        payload: payload as any,
        processed: false,
      },
      update: {
        eventType,
        payload: payload as any,
      },
    })

    try {
      // Processar evento baseado no tipo
      await this.handleEvent(gatewayProvider, eventType, payload)

      // Marcar como processado
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      })

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          action: AuditAction.WEBHOOK_PROCESSED,
          entityType: 'WebhookEvent',
          entityId: webhookEvent.id,
          userId: 'system',
          userEmail: 'system@webhook',
          description: `Webhook processado: ${eventType}`,
          metadata: {
            gatewayProvider,
            gatewayEventId,
            eventType,
          },
        },
      })
    } catch (error: any) {
      // Registrar erro no audit log
      await prisma.auditLog.create({
        data: {
          action: AuditAction.WEBHOOK_ERROR,
          entityType: 'WebhookEvent',
          entityId: webhookEvent.id,
          userId: 'system',
          userEmail: 'system@webhook',
          description: `Erro ao processar webhook: ${error.message}`,
          metadata: {
            gatewayProvider,
            gatewayEventId,
            eventType,
            error: error.message,
          },
        },
      })

      throw error
    }
  }

  /**
   * Processa eventos específicos do gateway
   */
  private static async handleEvent(gatewayProvider: string, eventType: string, payload: any): Promise<void> {
    const gateway = PaymentGatewayService.getGateway()

    switch (eventType) {
      case 'payment':
      case 'payment.updated':
        await this.handlePaymentEvent(payload)
        break

      case 'preapproval':
      case 'preapproval.updated':
        await this.handlePreapprovalEvent(payload)
        break

      case 'authorized_payment':
        await this.handleAuthorizedPaymentEvent(payload)
        break

      default:
        // Tipo de evento não tratado
        break
    }
  }

  /**
   * Processa eventos de pagamento
   */
  private static async handlePaymentEvent(payload: any): Promise<void> {
    const paymentId = payload.data?.id || payload.id
    const subscriptionId = payload.data?.external_reference || payload.external_reference
    const status = payload.data?.status || payload.status
    const amount = payload.data?.transaction_amount || payload.transaction_amount || 0

    if (!subscriptionId) {
      return
    }

    // Buscar assinatura
    const subscription = await prisma.subscription.findFirst({
      where: {
        gatewaySubscriptionId: subscriptionId,
      },
    })

    if (!subscription) {
      return
    }

    // Verificar se pagamento já existe
    const existingPayment = await prisma.paymentHistory.findFirst({
      where: {
        gatewayPaymentId: paymentId?.toString(),
      },
    })

    if (!existingPayment) {
      // Criar registro de pagamento
      // Converter para centavos (Prisma Decimal aceita number ou string)
      const amountInCents = amount * 100
      
      await prisma.paymentHistory.create({
        data: {
          id: `pay_${paymentId}`,
          subscriptionId: subscription.id,
          amount: amountInCents, // Prisma converterá automaticamente para Decimal
          currency: 'BRL',
          status: this.mapPaymentStatus(status),
          gatewayPaymentId: paymentId?.toString(),
          gatewayProvider: subscription.gatewayProvider || 'mercadopago',
          paidAt: payload.data?.date_approved ? new Date(payload.data.date_approved) : new Date(),
        },
      })

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PAYMENT_RECEIVED,
          entityType: 'PaymentHistory',
          entityId: `pay_${paymentId}`,
          userId: subscription.userId,
          userEmail: 'system@payment',
          description: `Pagamento recebido: R$ ${amount}`,
          metadata: {
            paymentId,
            subscriptionId,
            status,
          },
        },
      })
    }

    // Atualizar status da assinatura baseado no pagamento
    if (status === 'approved' || status === 'authorized') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
        },
      })
    } else if (status === 'rejected' || status === 'cancelled') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'past_due',
        },
      })

      // Registrar falha no audit log
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PAYMENT_FAILED,
          entityType: 'PaymentHistory',
          entityId: `pay_${paymentId}`,
          userId: subscription.userId,
          userEmail: 'system@payment',
          description: `Pagamento falhou: ${status}`,
          metadata: {
            paymentId,
            subscriptionId,
            status,
          },
        },
      })
    }
  }

  /**
   * Processa eventos de preapproval (assinatura)
   */
  private static async handlePreapprovalEvent(payload: any): Promise<void> {
    const preapprovalId = payload.data?.id || payload.id
    const status = payload.data?.status || payload.status

    if (!preapprovalId) {
      return
    }

    // Buscar assinatura
    const subscription = await prisma.subscription.findFirst({
      where: {
        gatewaySubscriptionId: preapprovalId.toString(),
      },
    })

    if (!subscription) {
      return
    }

    // Mapear status
    const subscriptionStatus = this.mapSubscriptionStatus(status)

    // Atualizar assinatura
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: subscriptionStatus,
      },
    })

    // Registrar no audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.SUBSCRIPTION_UPDATED,
        entityType: 'Subscription',
        entityId: subscription.id,
        userId: subscription.userId,
        userEmail: 'system@webhook',
        description: `Assinatura atualizada: ${status}`,
        metadata: {
          preapprovalId,
          status,
        },
      },
    })
  }

  /**
   * Processa eventos de pagamento autorizado
   */
  private static async handleAuthorizedPaymentEvent(payload: any): Promise<void> {
    const subscriptionId = payload.data?.external_reference || payload.external_reference

    if (!subscriptionId) {
      return
    }

    // Buscar assinatura
    const subscription = await prisma.subscription.findFirst({
      where: {
        gatewaySubscriptionId: subscriptionId,
      },
    })

    if (!subscription) {
      return
    }

    // Atualizar para ativa
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
      },
    })
  }

  /**
   * Mapeia status de pagamento do gateway para nosso formato
   */
  private static mapPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'pending',
      approved: 'approved',
      authorized: 'authorized',
      in_process: 'in_process',
      in_mediation: 'in_mediation',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'charged_back',
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }

  /**
   * Mapeia status de assinatura do gateway para nosso formato
   */
  private static mapSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      pending: 'pending',
      authorized: 'active',
      paused: 'past_due',
      cancelled: 'canceled',
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }
}

