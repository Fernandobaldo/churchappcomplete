import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { PaymentGatewayService } from '../../services/payment/PaymentGatewayService'
import { AuditAction, SubscriptionStatus } from '@prisma/client'

/**
 * Buscar assinatura do usuário
 */
export async function getSubscriptionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      include: {
        Plan: true,
        PaymentHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!subscription) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' })
    }

    return reply.send({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.Plan.id,
          name: subscription.Plan.name,
          price: subscription.Plan.price,
        },
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        paymentHistory: subscription.PaymentHistory.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paidAt,
        })),
      },
    })
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error)
    return reply.status(500).send({ error: error.message || 'Erro ao buscar assinatura' })
  }
}

/**
 * Cancelar assinatura
 */
export async function cancelSubscriptionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    const { cancelAtPeriodEnd } = request.body as { cancelAtPeriodEnd?: boolean }

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
    })

    if (!subscription) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' })
    }

    if (!subscription.gatewaySubscriptionId) {
      return reply.status(400).send({ error: 'Assinatura não está vinculada ao gateway' })
    }

    // Cancelar no gateway
    const gateway = PaymentGatewayService.getGateway()
    await gateway.cancelSubscription(subscription.gatewaySubscriptionId, cancelAtPeriodEnd ?? true)

    // Atualizar no banco
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: cancelAtPeriodEnd ?? true,
        canceledAt: new Date(),
      },
    })

    // Registrar no audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    await prisma.auditLog.create({
      data: {
        action: AuditAction.SUBSCRIPTION_CANCELED,
        entityType: 'Subscription',
        entityId: subscription.id,
        userId,
        userEmail: user?.email || '',
        description: 'Assinatura cancelada',
        metadata: {
          cancelAtPeriodEnd,
        },
      },
    })

    return reply.send({
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
      },
    })
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error)
    return reply.status(500).send({ error: error.message || 'Erro ao cancelar assinatura' })
  }
}

/**
 * Retomar assinatura cancelada
 */
export async function resumeSubscriptionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
    })

    if (!subscription) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' })
    }

    if (subscription.status !== 'canceled') {
      return reply.status(400).send({ error: 'Assinatura não está cancelada' })
    }

    if (!subscription.gatewaySubscriptionId) {
      return reply.status(400).send({ error: 'Assinatura não está vinculada ao gateway' })
    }

    // Retomar no gateway
    const gateway = PaymentGatewayService.getGateway()
    await gateway.resumeSubscription(subscription.gatewaySubscriptionId)

    // Atualizar no banco
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.active,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    })

    // Registrar no audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    await prisma.auditLog.create({
      data: {
        action: AuditAction.SUBSCRIPTION_RESUMED,
        entityType: 'Subscription',
        entityId: subscription.id,
        userId,
        userEmail: user?.email || '',
        description: 'Assinatura retomada',
      },
    })

    return reply.send({
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    })
  } catch (error: any) {
    console.error('Erro ao retomar assinatura:', error)
    return reply.status(500).send({ error: error.message || 'Erro ao retomar assinatura' })
  }
}

