import { prisma } from '../lib/prisma'
import { SubscriptionStatus, AuditAction } from '@prisma/client'
import { PaymentGatewayService } from './payment/PaymentGatewayService'
import { logAudit } from '../utils/auditHelper'
import { FastifyRequest } from 'fastify'
import { env } from '../env'

interface PlanData {
  name: string
  price: number
  features: string[]
  maxBranches?: number
  maxMembers?: number
  isActive?: boolean
  billingInterval?: string
}

/**
 * Serviço de Planos Admin
 * Responsabilidade: Gestão de planos do SaaS
 */
export class AdminPlanService {
  async getAllPlans() {
    const plans = await prisma.plan.findMany({
      include: {
        Subscription: {
          where: { status: SubscriptionStatus.active },
        },
      },
      orderBy: { price: 'asc' },
    })

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      maxBranches: plan.maxBranches,
      maxMembers: plan.maxMembers,
      isActive: plan.isActive,
      activeSubscriptions: plan.Subscription.length,
    }))
  }

  async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        Subscription: true,
      },
    })

    if (!plan) {
      return null
    }

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      maxBranches: plan.maxBranches,
      maxMembers: plan.maxMembers,
      isActive: plan.isActive,
      subscriptionsCount: plan.Subscription.length,
    }
  }

  async createPlan(data: PlanData, adminUserId: string, request?: FastifyRequest) {
    // Criar plano no banco
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        price: data.price,
        features: data.features,
        maxBranches: data.maxBranches,
        maxMembers: data.maxMembers,
        billingInterval: data.billingInterval || 'month',
        syncStatus: 'pending',
      },
    })

    try {
      // Sincronizar com gateway
      const gateway = PaymentGatewayService.getGateway()
      const gatewayProvider = env.PAYMENT_GATEWAY

      // Criar produto no gateway
      const product = await gateway.createProduct({
        name: plan.name,
        description: `Plano ${plan.name} - ${plan.features.join(', ')}`,
      })

      // Criar preço no gateway (valor em centavos)
      const price = await gateway.createPrice({
        productId: product.id,
        amount: Math.round(plan.price * 100), // Converter para centavos
        currency: 'BRL',
        interval: (data.billingInterval || 'month') as any,
      })

      // Atualizar plano com IDs do gateway
      const updatedPlan = await prisma.plan.update({
        where: { id: plan.id },
        data: {
          gatewayProvider,
          gatewayProductId: product.id,
          gatewayPriceId: price.id,
          syncStatus: 'synced',
        },
      })

      // Registrar no audit log
      if (request) {
        await logAudit(request, AuditAction.PLAN_SYNCED_TO_GATEWAY, 'Plan', 
          `Plano ${plan.name} sincronizado com ${gatewayProvider}`, {
          entityId: plan.id,
          metadata: {
            gateway: gatewayProvider,
            gatewayProductId: product.id,
            gatewayPriceId: price.id,
          },
        })
      } else {
        await prisma.auditLog.create({
          data: {
            action: AuditAction.PLAN_SYNCED_TO_GATEWAY,
            entityType: 'Plan',
            entityId: plan.id,
            userId: adminUserId,
            userEmail: '',
            description: `Plano ${plan.name} sincronizado com ${gatewayProvider}`,
            adminUserId,
            metadata: {
              gateway: gatewayProvider,
              gatewayProductId: product.id,
              gatewayPriceId: price.id,
            },
          },
        })
      }

      return updatedPlan
    } catch (error: any) {
      // Atualizar status de erro
      await prisma.plan.update({
        where: { id: plan.id },
        data: { syncStatus: 'error' },
      })

      // Registrar erro no audit log
      if (request) {
        await logAudit(request, AuditAction.PLAN_SYNC_ERROR, 'Plan',
          `Erro ao sincronizar plano ${plan.name} com gateway: ${error.message}`, {
          entityId: plan.id,
          metadata: {
            error: error.message,
          },
        })
      } else {
        await prisma.auditLog.create({
          data: {
            action: AuditAction.PLAN_SYNC_ERROR,
            entityType: 'Plan',
            entityId: plan.id,
            userId: adminUserId,
            userEmail: '',
            description: `Erro ao sincronizar plano ${plan.name} com gateway: ${error.message}`,
            adminUserId,
            metadata: {
              error: error.message,
            },
          },
        })
      }

      // Retornar plano mesmo com erro (para não quebrar o fluxo)
      return plan
    }
  }

  async updatePlan(id: string, data: Partial<PlanData>, adminUserId: string, request?: FastifyRequest) {
    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      throw new Error('Plano não encontrado')
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.price !== undefined) updateData.price = data.price
    if (data.features !== undefined) updateData.features = data.features
    if (data.maxBranches !== undefined) updateData.maxBranches = data.maxBranches
    if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.billingInterval !== undefined) updateData.billingInterval = data.billingInterval

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    })

    // Sincronizar com gateway se tiver gatewayProductId
    if (plan.gatewayProductId) {
      try {
        const gateway = PaymentGatewayService.getGateway()

        // Atualizar produto no gateway (se nome mudou)
        if (data.name !== undefined) {
          await gateway.updateProduct(plan.gatewayProductId, {
            name: plan.name,
            description: `Plano ${plan.name} - ${plan.features.join(', ')}`,
          })
        }

        // Se preço mudou, criar novo preço (gateways geralmente não permitem atualizar preços)
        if (data.price !== undefined && data.price !== existingPlan.price) {
          const newPrice = await gateway.createPrice({
            productId: plan.gatewayProductId,
            amount: Math.round(plan.price * 100),
            currency: 'BRL',
            interval: (plan.billingInterval || 'month') as any,
          })

          await prisma.plan.update({
            where: { id },
            data: {
              gatewayPriceId: newPrice.id,
              syncStatus: 'synced',
            },
          })
        }

        // Registrar no audit log
        if (request) {
          await logAudit(request, AuditAction.PLAN_SYNCED_TO_GATEWAY, 'Plan',
            `Plano ${plan.name} atualizado e sincronizado com gateway`, {
            entityId: plan.id,
            metadata: {
              changes: Object.keys(updateData),
            },
          })
        }
      } catch (error: any) {
        await prisma.plan.update({
          where: { id },
          data: { syncStatus: 'error' },
        })

        if (request) {
          await logAudit(request, AuditAction.PLAN_SYNC_ERROR, 'Plan',
            `Erro ao sincronizar atualização do plano ${plan.name}: ${error.message}`, {
            entityId: plan.id,
            metadata: {
              error: error.message,
            },
          })
        }
      }
    }

    // Registrar no audit log
    if (!request) {
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_CONFIG_UPDATED',
          entityType: 'Plan',
          entityId: plan.id,
          userId: adminUserId,
          userEmail: '',
          description: `Plano ${plan.name} foi atualizado`,
          adminUserId,
        },
      })
    }

    return plan
  }

  async activatePlan(id: string, adminUserId: string, request?: FastifyRequest) {
    const plan = await prisma.plan.update({
      where: { id },
      data: { isActive: true },
    })

    // Sincronizar com gateway se aplicável
    if (plan.gatewayProductId) {
      try {
        const gateway = PaymentGatewayService.getGateway()
        // MercadoPago não tem desativação de produto, mas podemos atualizar
        await gateway.updateProduct(plan.gatewayProductId, {
          name: plan.name,
        })
      } catch (error: any) {
        console.error('Erro ao sincronizar ativação do plano:', error)
      }
    }

    if (request) {
      await logAudit(request, AuditAction.PLAN_SYNCED_TO_GATEWAY, 'Plan',
        `Plano ${plan.name} foi ativado`, {
        entityId: plan.id,
      })
    } else {
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_CONFIG_UPDATED',
          entityType: 'Plan',
          entityId: plan.id,
          userId: adminUserId,
          userEmail: '',
          description: `Plano ${plan.name} foi ativado`,
          adminUserId,
        },
      })
    }

    return plan
  }

  async deactivatePlan(id: string, adminUserId: string, request?: FastifyRequest) {
    const plan = await prisma.plan.update({
      where: { id },
      data: { isActive: false },
    })

    // Sincronizar com gateway se aplicável
    if (plan.gatewayProductId) {
      try {
        const gateway = PaymentGatewayService.getGateway()
        // MercadoPago não tem desativação de produto, mas podemos atualizar
        await gateway.updateProduct(plan.gatewayProductId, {
          name: plan.name,
        })
      } catch (error: any) {
        console.error('Erro ao sincronizar desativação do plano:', error)
      }
    }

    if (request) {
      await logAudit(request, AuditAction.PLAN_SYNCED_TO_GATEWAY, 'Plan',
        `Plano ${plan.name} foi desativado`, {
        entityId: plan.id,
      })
    } else {
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_CONFIG_UPDATED',
          entityType: 'Plan',
          entityId: plan.id,
          userId: adminUserId,
          userEmail: '',
          description: `Plano ${plan.name} foi desativado`,
          adminUserId,
        },
      })
    }

    return plan
  }
}

