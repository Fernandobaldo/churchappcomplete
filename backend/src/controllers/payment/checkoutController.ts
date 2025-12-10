import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../lib/prisma'
import { PaymentGatewayService } from '../../services/payment/PaymentGatewayService'
import { AuditAction } from '@prisma/client'

interface CheckoutRequestBody {
  planId: string
  paymentMethodId?: string
  trialDays?: number
}

/**
 * Controller para criar checkout/assinatura
 */
export async function createCheckoutHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    const body = request.body as CheckoutRequestBody
    const { planId, paymentMethodId, trialDays } = body

    if (!planId) {
      return reply.status(400).send({ error: 'planId é obrigatório' })
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return reply.status(404).send({ error: 'Plano não encontrado' })
    }

    if (!plan.isActive) {
      return reply.status(400).send({ error: 'Plano não está ativo' })
    }

    if (!plan.gatewayProvider || !plan.gatewayPriceId) {
      return reply.status(400).send({ error: 'Plano não está sincronizado com gateway' })
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    // Verificar se já tem assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['active', 'trialing', 'past_due'],
        },
      },
    })

    if (existingSubscription) {
      return reply.status(400).send({ 
        error: 'Usuário já possui uma assinatura ativa',
        subscriptionId: existingSubscription.id,
      })
    }

    // Obter gateway
    const gateway = PaymentGatewayService.getGateway()

    // Buscar ou criar cliente no gateway
    const customer = await gateway.getOrCreateCustomer({
      email: user.email,
      name: user.name,
    })

    // Calcular trial end se necessário
    let trialEnd: Date | undefined
    if (trialDays && trialDays > 0) {
      trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + trialDays)
    }

    // Criar assinatura no gateway
    const gatewaySubscription = await gateway.createSubscription({
      customerId: customer.id,
      priceId: plan.gatewayPriceId,
      paymentMethodId,
      trialEnd,
      metadata: {
        userId,
        planId,
      },
    })

    // Criar assinatura no banco
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: gatewaySubscription.status,
        gatewayProvider: plan.gatewayProvider,
        gatewaySubscriptionId: gatewaySubscription.id,
        gatewayCustomerId: customer.id,
        paymentMethodId,
        currentPeriodStart: gatewaySubscription.currentPeriodStart,
        currentPeriodEnd: gatewaySubscription.currentPeriodEnd,
        trialEnd: gatewaySubscription.trialEnd,
        cancelAtPeriodEnd: gatewaySubscription.cancelAtPeriodEnd,
      },
    })

    // Registrar no audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.SUBSCRIPTION_CREATED,
        entityType: 'Subscription',
        entityId: subscription.id,
        userId,
        userEmail: user.email,
        description: `Assinatura criada para plano ${plan.name}`,
        metadata: {
          planId,
          gatewaySubscriptionId: gatewaySubscription.id,
          status: gatewaySubscription.status,
        },
      },
    })

    return reply.status(201).send({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        checkoutUrl: gatewaySubscription.checkoutUrl,
        clientSecret: gatewaySubscription.clientSecret,
      },
    })
  } catch (error: any) {
    console.error('Erro ao criar checkout:', error)
    return reply.status(500).send({ error: error.message || 'Erro ao criar checkout' })
  }
}


