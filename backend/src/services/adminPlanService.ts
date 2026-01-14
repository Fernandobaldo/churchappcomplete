import { prisma } from '../lib/prisma'
import { SubscriptionStatus, AuditAction } from '@prisma/client'
import { PaymentGatewayService } from './payment/PaymentGatewayService'
import { logAudit } from '../utils/auditHelper'
import { FastifyRequest } from 'fastify'
import { env } from '../env'
import { validateAndNormalizeFeatures, PlanFeatureId } from '../constants/planFeatures'

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

    return plans.map((plan: any) => ({
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
    // Verificar se já existe um plano com o mesmo nome
    const existingPlan = await prisma.plan.findUnique({
      where: { name: data.name },
    })

    if (existingPlan) {
      throw new Error(`Já existe um plano com o nome "${data.name}". Escolha um nome diferente.`)
    }

    // Validate and normalize features BEFORE creating plan
    // This ensures only valid, canonical feature IDs are stored
    const { valid: validatedFeatures, invalid } = validateAndNormalizeFeatures(data.features)
    
    if (invalid.length > 0) {
      throw new Error(
        `Invalid feature IDs: ${invalid.join(', ')}. ` +
        `All features must be from the canonical feature catalog.`
      )
    }

    // Criar plano no banco
    // Produtos e preços serão criados no gateway quando necessário (no checkout)
    const gatewayProvider = env.PAYMENT_GATEWAY
    
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        price: data.price,
        features: validatedFeatures, // Use normalized, validated features
        maxBranches: data.maxBranches,
        maxMembers: data.maxMembers,
        billingInterval: data.billingInterval || 'month',
        gatewayProvider: gatewayProvider as any,
        // IDs serão gerados quando o produto/preço for criado no gateway
        gatewayProductId: `prod_${data.name.toLowerCase().replace(/\s+/g, '_')}`,
        gatewayPriceId: `price_${data.name.toLowerCase().replace(/\s+/g, '_')}_${Math.round(data.price * 100)}_${data.billingInterval || 'month'}`,
        syncStatus: 'synced', // 'synced' porque será criado no checkout
      },
    })

    // Registrar no audit log
    if (request) {
      await logAudit(request, AuditAction.PLAN_SYNCED_TO_GATEWAY, 'Plan', 
        `Plano ${plan.name} criado. PreApproval Plan será criado no checkout.`, {
        entityId: plan.id,
        metadata: {
          gateway: gatewayProvider,
          note: 'PreApproval Plan será criado quando cliente fizer checkout',
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
          description: `Plano ${plan.name} criado. PreApproval Plan será criado no checkout.`,
          adminUserId,
          metadata: {
            gateway: gatewayProvider,
            note: 'PreApproval Plan será criado quando cliente fizer checkout',
          },
        },
      })
    }

    return plan
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
    
    // Validate and normalize features if provided
    if (data.features !== undefined) {
      // Allow empty array (can be used to disable all features temporarily)
      if (data.features.length > 0) {
        const { valid: validatedFeatures, invalid } = validateAndNormalizeFeatures(data.features)
        
        if (invalid.length > 0) {
          throw new Error(
            `Invalid feature IDs: ${invalid.join(', ')}. ` +
            `All features must be from the canonical feature catalog.`
          )
        }
        
        updateData.features = validatedFeatures
      } else {
        updateData.features = []
      }
    }
    
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
        // Atualizar produto no gateway
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
    // Check if plan has active subscriptions
    const activeSubscriptionsCount = await prisma.subscription.count({
      where: {
        planId: id,
        status: SubscriptionStatus.active,
      },
    })

    if (activeSubscriptionsCount > 0) {
      throw new Error(
        `Não é possível desativar este plano. Existem ${activeSubscriptionsCount} assinatura(s) ativa(s). ` +
        `Desative as assinaturas antes de desativar o plano.`
      )
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: { isActive: false },
    })

    // Sincronizar com gateway se aplicável
    if (plan.gatewayProductId) {
      try {
        const gateway = PaymentGatewayService.getGateway()
        // Atualizar produto no gateway
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

