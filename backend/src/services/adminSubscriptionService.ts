import { prisma } from '../lib/prisma'

interface SubscriptionFilters {
  status?: string
  planId?: string
}

interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Serviço de Assinaturas Admin
 * Responsabilidade: Gestão de assinaturas de planos
 */
export class AdminSubscriptionService {
  async getAllSubscriptions(
    filters: SubscriptionFilters = {},
    pagination: PaginationParams = {}
  ) {
    const page = pagination.page || 1
    const limit = pagination.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.planId) {
      where.planId = filters.planId
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          User: true,
          Plan: true,
        },
      }),
      prisma.subscription.count({ where }),
    ])

    return {
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.User.id,
        userName: sub.User.name,
        userEmail: sub.User.email,
        planId: sub.Plan.id,
        planName: sub.Plan.name,
        planPrice: sub.Plan.price,
        status: sub.status,
        billingType: 'mensal', // Placeholder
        startedAt: sub.startedAt,
        endsAt: sub.endsAt,
        // Manter também o formato aninhado para compatibilidade
        user: {
          id: sub.User.id,
          name: sub.User.name,
          email: sub.User.email,
        },
        plan: {
          id: sub.Plan.id,
          name: sub.Plan.name,
          price: sub.Plan.price,
        },
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getSubscriptionById(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        User: true,
        Plan: true,
      },
    })

    if (!subscription) {
      return null
    }

    return {
      id: subscription.id,
      user: {
        id: subscription.User.id,
        name: subscription.User.name,
        email: subscription.User.email,
      },
      plan: {
        id: subscription.Plan.id,
        name: subscription.Plan.name,
        price: subscription.Plan.price,
        features: subscription.Plan.features,
        maxBranches: subscription.Plan.maxBranches,
        maxMembers: subscription.Plan.maxMembers,
      },
      status: subscription.status,
      startedAt: subscription.startedAt,
      endsAt: subscription.endsAt,
    }
  }

  async changeSubscriptionPlan(
    subscriptionId: string,
    planId: string,
    adminUserId: string
  ) {
    // Verificar se o novo plano existe e está ativo
    const newPlan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!newPlan) {
      throw new Error('Plano não encontrado')
    }

    if (!newPlan.isActive) {
      throw new Error('Não é possível mudar para um plano inativo. O plano deve estar ativo para novas assinaturas.')
    }

    const oldSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        Plan: true,
      },
    })

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { planId },
      include: {
        Plan: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'PLAN_CHANGED',
        entityType: 'Subscription',
        entityId: subscriptionId,
        userId: adminUserId,
        userEmail: '',
        description: `Plano da assinatura foi alterado`,
        metadata: {
          oldPlanId: oldSubscription?.planId,
          newPlanId: planId,
        },
        adminUserId,
      },
    })

    return subscription
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: string,
    adminUserId: string
  ) {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    })

    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_CHANGED',
        entityType: 'Subscription',
        entityId: subscriptionId,
        userId: adminUserId,
        userEmail: '',
        description: `Status da assinatura foi alterado para ${status}`,
        metadata: { status },
        adminUserId,
      },
    })

    return subscription
  }

  async cancelSubscription(subscriptionId: string, adminUserId: string) {
    return this.updateSubscriptionStatus(subscriptionId, 'cancelled', adminUserId)
  }

  async reactivateSubscription(subscriptionId: string, adminUserId: string) {
    return this.updateSubscriptionStatus(subscriptionId, 'active', adminUserId)
  }

  async getSubscriptionHistory(subscriptionId: string) {
    // Busca histórico de mudanças no AuditLog
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Subscription',
        entityId: subscriptionId,
        action: {
          in: ['PLAN_CHANGED', 'SUBSCRIPTION_CHANGED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return logs.map((log) => ({
      action: log.action,
      description: log.description,
      createdAt: log.createdAt,
      metadata: log.metadata,
    }))
  }
}

