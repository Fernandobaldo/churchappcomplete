import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AdminDashboardService } from '../services/adminDashboardService'
import { AdminUserService } from '../services/adminUserService'
import { AdminChurchService } from '../services/adminChurchService'
import { AdminMemberService } from '../services/adminMemberService'
import { AdminPlanService } from '../services/adminPlanService'
import { AdminSubscriptionService } from '../services/adminSubscriptionService'
import { AdminAuditService } from '../services/adminAuditService'
import { AdminConfigService } from '../services/adminConfigService'
import { AdminRole } from '@prisma/client'

// Helper to get admin user ID from request
function getAdminUserId(req: FastifyRequest): string {
  const adminUser = (req as any).adminUser
  return adminUser?.id || adminUser?.adminUserId || 'unknown'
}

function getAdminRole(req: FastifyRequest): AdminRole {
  const adminUser = (req as any).adminUser
  return adminUser?.adminRole || AdminRole.SUPPORT
}

// Initialize services
const dashboardService = new AdminDashboardService()
const userService = new AdminUserService()
const churchService = new AdminChurchService()
const memberService = new AdminMemberService()
const planService = new AdminPlanService()
const subscriptionService = new AdminSubscriptionService()
const auditService = new AdminAuditService()
const configService = new AdminConfigService()

// ==================== DASHBOARD ====================

export async function getDashboardStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const stats = await dashboardService.getDashboardStats()
    return reply.send(stats)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== USERS ====================

export async function getAllUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      status: z.enum(['active', 'blocked']).optional(),
      planId: z.string().optional(),
      search: z.string().optional(),
    })
    const query = querySchema.parse(req.query)
    
    const result = await userService.getAllUsers(
      {
        status: query.status,
        planId: query.planId,
        search: query.search,
      },
      {
        page: query.page,
        limit: query.limit,
      }
    )
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getUserByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const user = await userService.getUserById(id)
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }
    return reply.send(user)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function blockUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    await userService.blockUser(id, adminUserId)
    return reply.send({ message: 'Usuário bloqueado com sucesso' })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function unblockUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    await userService.unblockUser(id, adminUserId)
    return reply.send({ message: 'Usuário desbloqueado com sucesso' })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function sendPasswordResetHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const result = await userService.sendPasswordReset(id, adminUserId)
    return reply.send(result)
  } catch (error: any) {
    if (error.message?.includes('não encontrado')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function impersonateUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const adminRole = getAdminRole(req)
    const result = await userService.impersonateUser(id, adminUserId, adminRole)
    return reply.send(result)
  } catch (error: any) {
    if (error.message?.includes('não encontrado')) {
      return reply.status(404).send({ error: error.message })
    }
    if (error.message?.includes('permissão')) {
      return reply.status(403).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== CHURCHES ====================

export async function getAllChurchesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      name: z.string().optional(),
      planId: z.string().optional(),
      status: z.enum(['active', 'suspended']).optional(),
    })
    const query = querySchema.parse(req.query)
    
    const result = await churchService.getAllChurches(
      {
        name: query.name,
        planId: query.planId,
        status: query.status,
      },
      {
        page: query.page,
        limit: query.limit,
      }
    )
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getChurchByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const church = await churchService.getChurchById(id)
    if (!church) {
      return reply.status(404).send({ error: 'Igreja não encontrada' })
    }
    return reply.send(church)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getChurchBranchesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const branches = await churchService.getChurchBranches(id)
    return reply.send({ branches })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getChurchMembersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
    })
    const query = querySchema.parse(req.query)
    
    const result = await churchService.getChurchMembers(id, {
      page: query.page,
      limit: query.limit,
    })
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function suspendChurchHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    await churchService.suspendChurch(id, adminUserId)
    return reply.send({ message: 'Igreja suspensa com sucesso' })
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function reactivateChurchHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    await churchService.reactivateChurch(id, adminUserId)
    return reply.send({ message: 'Igreja reativada com sucesso' })
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function changeChurchPlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const bodySchema = z.object({
      planId: z.string(),
    })
    const { planId } = bodySchema.parse(req.body)
    const adminUserId = getAdminUserId(req)
    await churchService.changeChurchPlan(id, planId, adminUserId)
    return reply.send({ message: 'Plano da igreja alterado com sucesso' })
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function impersonateChurchOwnerHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const adminRole = getAdminRole(req)
    const result = await churchService.impersonateChurchOwner(id, adminUserId, adminRole)
    return reply.send(result)
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    if (error.message?.includes('permissão')) {
      return reply.status(403).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== MEMBERS ====================

export async function getAllMembersHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      search: z.string().optional(),
    })
    const query = querySchema.parse(req.query)
    
    const result = await memberService.getAllMembers(
      {
        search: query.search,
      },
      {
        page: query.page,
        limit: query.limit,
      }
    )
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMemberByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const member = await memberService.getMemberById(id)
    if (!member) {
      return reply.status(404).send({ error: 'Membro não encontrado' })
    }
    return reply.send(member)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== PLANS ====================

export async function getAllPlansHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const plans = await planService.getAllPlans()
    const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures')
    return reply.send({
      plans,
      availableFeatures: AVAILABLE_PLAN_FEATURES,
    })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

/**
 * GET /admin/plans/features
 * Returns the canonical feature catalog (only for SUPERADMIN)
 */
export async function getPlanFeaturesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures')
    return reply.send({
      features: AVAILABLE_PLAN_FEATURES,
    })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getPlanByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const plan = await planService.getPlanById(id)
    if (!plan) {
      return reply.status(404).send({ error: 'Plano não encontrado' })
    }
    return reply.send(plan)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function createPlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const bodySchema = z.object({
      name: z.string(),
      price: z.number(),
      features: z.array(z.string()),
      maxBranches: z.number().optional(),
      maxMembers: z.number().optional(),
      billingInterval: z.string().optional(),
    })
    const data = bodySchema.parse(req.body)
    
    // Validar features
    const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures')
    const validFeatureIds = AVAILABLE_PLAN_FEATURES.map((f) => f.id)
    const invalidFeatures = data.features.filter((f) => !validFeatureIds.includes(f as any))
    if (invalidFeatures.length > 0) {
      return reply.status(400).send({
        error: `Features inválidas: ${invalidFeatures.join(', ')}`,
      })
    }
    
    const adminUserId = getAdminUserId(req)
    const plan = await planService.createPlan(data, adminUserId, req)
    return reply.status(201).send(plan)
  } catch (error: any) {
    // Tratar erro de constraint única (nome duplicado)
    if (
      error.code === 'P2002' || 
      error.message?.includes('Unique constraint') ||
      error.message?.includes('Já existe um plano com o nome')
    ) {
      return reply.status(409).send({ 
        error: error.message || 'Já existe um plano com este nome. Escolha um nome diferente.' 
      })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function updatePlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const bodySchema = z.object({
      name: z.string().optional(),
      price: z.number().optional(),
      features: z.array(z.string()).optional(),
      maxBranches: z.number().optional(),
      maxMembers: z.number().optional(),
      isActive: z.boolean().optional(),
      billingInterval: z.string().optional(),
    })
    const data = bodySchema.parse(req.body)
    
    // Validar features se fornecidas
    if (data.features !== undefined && data.features.length > 0) {
      const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures')
      const validFeatureIds = AVAILABLE_PLAN_FEATURES.map((f) => f.id)
      const invalidFeatures = data.features.filter((f) => !validFeatureIds.includes(f as any))
      if (invalidFeatures.length > 0) {
        return reply.status(400).send({
          error: `Features inválidas: ${invalidFeatures.join(', ')}`,
        })
      }
    }
    
    const adminUserId = getAdminUserId(req)
    const plan = await planService.updatePlan(id, data, adminUserId, req)
    return reply.send(plan)
  } catch (error: any) {
    if (error.message?.includes('não encontrado')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function activatePlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const plan = await planService.activatePlan(id, adminUserId, req)
    return reply.send(plan)
  } catch (error: any) {
    if (error.message?.includes('não encontrado')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function deactivatePlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const plan = await planService.deactivatePlan(id, adminUserId, req)
    return reply.send(plan)
  } catch (error: any) {
    // Retornar 409 se houver subscriptions ativas
    if (error.message?.includes('assinatura') || error.message?.includes('subscription')) {
      return reply.status(409).send({ error: error.message })
    }
    if (error.message?.includes('não encontrado')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== SUBSCRIPTIONS ====================

export async function getAllSubscriptionsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      status: z.string().optional(),
      planId: z.string().optional(),
    })
    const query = querySchema.parse(req.query)
    
    const result = await subscriptionService.getAllSubscriptions(
      {
        status: query.status,
        planId: query.planId,
      },
      {
        page: query.page,
        limit: query.limit,
      }
    )
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getSubscriptionByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const subscription = await subscriptionService.getSubscriptionById(id)
    if (!subscription) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' })
    }
    return reply.send(subscription)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getSubscriptionHistoryHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const history = await subscriptionService.getSubscriptionHistory(id)
    return reply.send({ history })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function changeSubscriptionPlanHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const bodySchema = z.object({
      planId: z.string(),
    })
    const { planId } = bodySchema.parse(req.body)
    const adminUserId = getAdminUserId(req)
    const subscription = await subscriptionService.changeSubscriptionPlan(id, planId, adminUserId)
    return reply.send(subscription)
  } catch (error: any) {
    if (error.message?.includes('não encontrado') || error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    if (error.message?.includes('inativo')) {
      return reply.status(400).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function updateSubscriptionStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const bodySchema = z.object({
      status: z.enum(['pending', 'active', 'past_due', 'canceled', 'unpaid', 'trialing']),
    })
    const { status } = bodySchema.parse(req.body)
    const adminUserId = getAdminUserId(req)
    const subscription = await subscriptionService.updateSubscriptionStatus(id, status, adminUserId)
    return reply.send(subscription)
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function cancelSubscriptionHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const subscription = await subscriptionService.cancelSubscription(id, adminUserId)
    return reply.send(subscription)
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function reactivateSubscriptionHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string }
    const adminUserId = getAdminUserId(req)
    const subscription = await subscriptionService.reactivateSubscription(id, adminUserId)
    return reply.send(subscription)
  } catch (error: any) {
    if (error.message?.includes('não encontrada')) {
      return reply.status(404).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== AUDIT ====================

export async function getAuditLogsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const querySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      adminUserId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    const query = querySchema.parse(req.query)
    
    const result = await auditService.getAdminAuditLogs(
      {
        adminUserId: query.adminUserId,
        action: query.action as any,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      },
      {
        page: query.page,
        limit: query.limit,
      }
    )
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

// ==================== CONFIG ====================

export async function getSystemConfigHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const config = await configService.getSystemConfig()
    return reply.send(config)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function updateSystemConfigHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const bodySchema = z.object({}).passthrough() // Aceita qualquer objeto
    const config = bodySchema.parse(req.body)
    const adminUserId = getAdminUserId(req)
    const result = await configService.updateSystemConfig(config, adminUserId)
    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}