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
      include: {
        Plan: true, // Incluir dados do plano atual
      },
    })

    // Se já tem assinatura ativa, verificar se está tentando trocar de plano
    if (existingSubscription) {
      // Se está tentando assinar o mesmo plano, retornar erro
      if (existingSubscription.planId === planId) {
        return reply.status(400).send({ 
          error: 'Você já possui uma assinatura ativa para este plano',
          subscriptionId: existingSubscription.id,
        })
      }

      // Verificar se o plano atual é Free (permite upgrade)
      const currentPlan = existingSubscription.Plan
      const isCurrentPlanFree = currentPlan?.price === 0 || 
                                  currentPlan?.name.toLowerCase() === 'free'
      
      // Verificar se o novo plano é Free (permite downgrade)
      const isNewPlanFree = plan.price === 0 || plan.name.toLowerCase() === 'free'

      // NÃO permitir criar nova subscription Free se já tem uma Free ativa
      if (isCurrentPlanFree && isNewPlanFree) {
        return reply.status(400).send({ 
          error: 'Você já possui uma assinatura Free ativa. Use o portal admin para gerenciar sua assinatura.',
          subscriptionId: existingSubscription.id,
        })
      }

      // Permitir troca de plano APENAS se:
      // 1. Está saindo do Free (upgrade para plano pago) - CANCELAR Free e criar pago
      // 2. Está indo para o Free (downgrade de pago) - CANCELAR pago e criar Free
      // 3. Está trocando entre planos pagos (upgrade/downgrade) - CANCELAR e criar novo
      if (isCurrentPlanFree || isNewPlanFree || currentPlan?.price !== plan.price) {
        // Cancelar assinatura atual antes de criar nova
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'canceled',
            endsAt: new Date(),
          },
        })

        // Registrar no audit log
        await prisma.auditLog.create({
          data: {
            action: AuditAction.SUBSCRIPTION_CANCELED,
            entityType: 'Subscription',
            entityId: existingSubscription.id,
            userId,
            userEmail: user.email,
            description: `Assinatura cancelada para troca de plano (${currentPlan?.name || 'N/A'} → ${plan.name})`,
            metadata: {
              oldPlanId: existingSubscription.planId,
              newPlanId: planId,
            },
          },
        })

        // Continuar com a criação da nova assinatura abaixo
      } else {
        // Se for o mesmo tipo de plano (mesmo preço), não permitir
        return reply.status(400).send({ 
          error: 'Você já possui uma assinatura ativa para um plano similar',
          subscriptionId: existingSubscription.id,
        })
      }
    }

    // Obter gateway
    const gateway = PaymentGatewayService.getGateway()

    // Buscar ou criar cliente no gateway
    // Combinar firstName e lastName para o nome completo
    const fullName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.lastName || 'Usuário'

    const customer = await gateway.getOrCreateCustomer({
      email: user.email,
      name: fullName,
      phone: user.phone || undefined,
      document: user.document || undefined,
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
      customerEmail: user.email,
      planId: plan.id,
      planData: {
        amount: plan.price, // Valor em reais
        interval: (plan.billingInterval || 'month') as any,
        currency: 'BRL',
      },
      paymentMethodId,
      trialEnd,
      metadata: {
        userId,
        planId,
      },
    })

    // Determinar gateway provider (usar do plano se existir, senão do env)
    const gatewayProvider = plan.gatewayProvider || process.env.PAYMENT_GATEWAY || 'stripe'

    // Criar assinatura no banco
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: gatewaySubscription.status,
        gatewayProvider: gatewayProvider as any,
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



