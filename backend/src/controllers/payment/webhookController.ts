import { FastifyRequest, FastifyReply } from 'fastify'
import { PaymentGatewayService } from '../../services/payment/PaymentGatewayService'
import { WebhookProcessor } from '../../services/payment/webhookProcessor'
import { AuditAction } from '@prisma/client'
import { prisma } from '../../lib/prisma'

/**
 * Controller para receber webhooks dos gateways de pagamento
 */
export async function webhookHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const gatewayProvider = (request.params as any).provider || 'mercadopago'
    const headers = request.headers as Record<string, string>
    const payload = request.body as any

    // Obter gateway
    const gateway = PaymentGatewayService.getGateway()

    // Validar assinatura do webhook
    const signature = headers['x-signature'] || headers['x-request-id'] || ''
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload)

    if (!gateway.verifyWebhookSignature(rawBody, signature)) {
      // Registrar tentativa de webhook inválido
      await prisma.auditLog.create({
        data: {
          action: AuditAction.WEBHOOK_ERROR,
          entityType: 'WebhookEvent',
          userId: 'system',
          userEmail: 'system@webhook',
          description: 'Tentativa de webhook com assinatura inválida',
          metadata: {
            gatewayProvider,
            ipAddress: request.ip,
          },
        },
      })

      return reply.status(401).send({ error: 'Assinatura inválida' })
    }

    // Parsear evento
    const event = gateway.parseWebhookEvent(payload, headers)

    // Registrar recebimento do webhook
    await prisma.auditLog.create({
      data: {
        action: AuditAction.WEBHOOK_RECEIVED,
        entityType: 'WebhookEvent',
        entityId: event.id,
        userId: 'system',
        userEmail: 'system@webhook',
        description: `Webhook recebido: ${event.type}`,
        metadata: {
          gatewayProvider,
          eventType: event.type,
          eventId: event.id,
        },
      },
    })

    // Processar evento de forma idempotente
    await WebhookProcessor.processEvent(
      gatewayProvider,
      event.id,
      event.type,
      payload
    )

    return reply.status(200).send({ received: true })
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error)

    // Registrar erro
    await prisma.auditLog.create({
      data: {
        action: AuditAction.WEBHOOK_ERROR,
        entityType: 'WebhookEvent',
        userId: 'system',
        userEmail: 'system@webhook',
        description: `Erro ao processar webhook: ${error.message}`,
        metadata: {
          error: error.message,
          stack: error.stack,
        },
      },
    })

    return reply.status(500).send({ error: 'Erro ao processar webhook' })
  }
}



