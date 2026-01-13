import { prisma } from '../../lib/prisma'
import { PaymentGatewayService } from './PaymentGatewayService'
import { WebhookEvent, PaymentStatus } from './types'
import { AuditAction, SubscriptionStatus } from '@prisma/client'

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

    // Eventos do Stripe
    if (gatewayProvider === 'stripe') {
      switch (eventType) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionEvent(payload)
          break

        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionDeleted(payload)
          break

        case 'invoice.payment_succeeded':
          await this.handleStripeInvoicePaymentSucceeded(payload)
          break

        case 'invoice.payment_failed':
          await this.handleStripeInvoicePaymentFailed(payload)
          break

        case 'invoice.created':
        case 'invoice.updated':
          await this.handleStripeInvoiceEvent(payload)
          break

        default:
          // Tipo de evento não tratado
          break
      }
    } else {
      // Eventos de outros gateways (MercadoPago, etc.)
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
          gatewayProvider: subscription.gatewayProvider || 'stripe',
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
          status: SubscriptionStatus.active,
        },
      })
    } else if (status === 'rejected' || status === 'cancelled') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.past_due,
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
        status: SubscriptionStatus.active,
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
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
      incomplete: 'pending',
      incomplete_expired: 'canceled',
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }

  /**
   * Processa eventos de assinatura do Stripe
   */
  private static async handleStripeSubscriptionEvent(payload: any): Promise<void> {
    const subscriptionData = payload.data?.object || payload.object
    const subscriptionId = subscriptionData.id
    const status = subscriptionData.status

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

    // Mapear status
    const subscriptionStatus = this.mapSubscriptionStatus(status)

    // Atualizar assinatura
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: subscriptionStatus,
        currentPeriodStart: subscriptionData.current_period_start
          ? new Date(subscriptionData.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscriptionData.current_period_end
          ? new Date(subscriptionData.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
        canceledAt: subscriptionData.canceled_at
          ? new Date(subscriptionData.canceled_at * 1000)
          : undefined,
        trialEnd: subscriptionData.trial_end
          ? new Date(subscriptionData.trial_end * 1000)
          : undefined,
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
        description: `Assinatura atualizada via webhook Stripe: ${status}`,
        metadata: {
          subscriptionId,
          status,
        },
      },
    })
  }

  /**
   * Processa cancelamento de assinatura do Stripe
   */
  private static async handleStripeSubscriptionDeleted(payload: any): Promise<void> {
    const subscriptionData = payload.data?.object || payload.object
    const subscriptionId = subscriptionData.id

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

    // Atualizar para cancelada
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.canceled,
        canceledAt: new Date(),
        endsAt: new Date(),
      },
    })

    // Registrar no audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.SUBSCRIPTION_CANCELED,
        entityType: 'Subscription',
        entityId: subscription.id,
        userId: subscription.userId,
        userEmail: 'system@webhook',
        description: 'Assinatura cancelada via webhook Stripe',
        metadata: {
          subscriptionId,
        },
      },
    })
  }

  /**
   * Processa pagamento bem-sucedido do Stripe
   */
  private static async handleStripeInvoicePaymentSucceeded(payload: any): Promise<void> {
    const invoice = payload.data?.object || payload.object
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    const invoiceId = invoice.id
    const amount = invoice.amount_paid / 100 // Converter de centavos para reais
    const status = invoice.status

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
        gatewayPaymentId: invoiceId,
      },
    })

    if (!existingPayment) {
      // Criar registro de pagamento
      await prisma.paymentHistory.create({
        data: {
          id: `pay_${invoiceId}`,
          subscriptionId: subscription.id,
          amount: amount * 100, // Converter para centavos (Prisma Decimal)
          currency: invoice.currency?.toUpperCase() || 'BRL',
          status: 'approved',
          gatewayPaymentId: invoiceId,
          gatewayProvider: subscription.gatewayProvider || 'stripe',
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
        },
      })

      // Registrar no audit log
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PAYMENT_RECEIVED,
          entityType: 'PaymentHistory',
          entityId: `pay_${invoiceId}`,
          userId: subscription.userId,
          userEmail: 'system@payment',
          description: `Pagamento recebido via Stripe: R$ ${amount.toFixed(2)}`,
          metadata: {
            invoiceId,
            subscriptionId,
            amount,
          },
        },
      })
    }

    // Atualizar status da assinatura para ativa
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.active,
      },
    })
  }

  /**
   * Processa falha de pagamento do Stripe
   */
  private static async handleStripeInvoicePaymentFailed(payload: any): Promise<void> {
    const invoice = payload.data?.object || payload.object
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    const invoiceId = invoice.id

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

    // Atualizar status da assinatura para past_due
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.past_due,
      },
    })

    // Registrar falha no audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.PAYMENT_FAILED,
        entityType: 'PaymentHistory',
        entityId: `pay_${invoiceId}`,
        userId: subscription.userId,
        userEmail: 'system@payment',
        description: 'Pagamento falhou via webhook Stripe',
        metadata: {
          invoiceId,
          subscriptionId,
        },
      },
    })
  }

  /**
   * Processa eventos de invoice do Stripe
   */
  private static async handleStripeInvoiceEvent(payload: any): Promise<void> {
    const invoice = payload.data?.object || payload.object
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

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

    // Atualizar períodos se necessário
    if (invoice.period_start && invoice.period_end) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodStart: new Date(invoice.period_start * 1000),
          currentPeriodEnd: new Date(invoice.period_end * 1000),
        },
      })
    }
  }
}

