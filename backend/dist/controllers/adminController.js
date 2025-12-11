import { AdminDashboardService } from '../services/adminDashboardService';
import { AdminUserService } from '../services/adminUserService';
import { AdminChurchService } from '../services/adminChurchService';
import { AdminMemberService } from '../services/adminMemberService';
import { AdminPlanService } from '../services/adminPlanService';
import { AdminSubscriptionService } from '../services/adminSubscriptionService';
import { AdminAuditService } from '../services/adminAuditService';
import { AdminConfigService } from '../services/adminConfigService';
import { z } from 'zod';
// Instâncias dos serviços
const dashboardService = new AdminDashboardService();
const userService = new AdminUserService();
const churchService = new AdminChurchService();
const memberService = new AdminMemberService();
const planService = new AdminPlanService();
const subscriptionService = new AdminSubscriptionService();
const auditService = new AdminAuditService();
const configService = new AdminConfigService();
// Helper para obter adminUserId do request
function getAdminUserId(request) {
    return request.adminUser?.adminUserId || request.adminUser?.id || '';
}
// ==================== DASHBOARD ====================
export async function getDashboardStatsHandler(req, reply) {
    try {
        const stats = await dashboardService.getDashboardStats();
        return reply.send(stats);
    }
    catch (error) {
        console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
        console.error('Stack:', error.stack);
        return reply.status(500).send({
            error: 'Erro ao buscar estatísticas do dashboard',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
// ==================== USERS ====================
export async function getAllUsersHandler(req, reply) {
    try {
        const query = req.query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const status = query.status;
        const planId = query.planId;
        const search = query.search;
        const result = await userService.getAllUsers({ status, planId, search }, { page, limit });
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getUserByIdHandler(req, reply) {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        if (!user) {
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }
        return reply.send(user);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function blockUserHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        await userService.blockUser(id, adminUserId);
        return reply.send({ message: 'Usuário bloqueado com sucesso' });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function unblockUserHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        await userService.unblockUser(id, adminUserId);
        return reply.send({ message: 'Usuário desbloqueado com sucesso' });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function sendPasswordResetHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const result = await userService.sendPasswordReset(id, adminUserId);
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function impersonateUserHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const adminRole = req.adminUser?.adminRole;
        if (!adminRole) {
            return reply.status(401).send({ error: 'Não autenticado' });
        }
        const result = await userService.impersonateUser(id, adminUserId, adminRole);
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
// ==================== CHURCHES ====================
export async function getAllChurchesHandler(req, reply) {
    try {
        const query = req.query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const name = query.name;
        const planId = query.planId;
        const status = query.status;
        const result = await churchService.getAllChurches({ name, planId, status }, { page, limit });
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getChurchByIdHandler(req, reply) {
    try {
        const { id } = req.params;
        const church = await churchService.getChurchById(id);
        if (!church) {
            return reply.status(404).send({ error: 'Igreja não encontrada' });
        }
        return reply.send(church);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getChurchBranchesHandler(req, reply) {
    try {
        const { id } = req.params;
        const branches = await churchService.getChurchBranches(id);
        return reply.send(branches);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getChurchMembersHandler(req, reply) {
    try {
        const { id } = req.params;
        const query = req.query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const result = await churchService.getChurchMembers(id, { page, limit });
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function suspendChurchHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        await churchService.suspendChurch(id, adminUserId);
        return reply.send({ message: 'Igreja suspensa com sucesso' });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function reactivateChurchHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        await churchService.reactivateChurch(id, adminUserId);
        return reply.send({ message: 'Igreja reativada com sucesso' });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function changeChurchPlanHandler(req, reply) {
    try {
        const { id } = req.params;
        const bodySchema = z.object({
            planId: z.string(),
        });
        const { planId } = bodySchema.parse(req.body);
        const adminUserId = getAdminUserId(req);
        await churchService.changeChurchPlan(id, planId, adminUserId);
        return reply.send({ message: 'Plano alterado com sucesso' });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function impersonateChurchOwnerHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const adminRole = req.adminUser?.adminRole;
        if (!adminRole) {
            return reply.status(401).send({ error: 'Não autenticado' });
        }
        const result = await churchService.impersonateChurchOwner(id, adminUserId, adminRole);
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
// ==================== MEMBERS ====================
export async function getAllMembersHandler(req, reply) {
    try {
        const query = req.query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const search = query.search;
        const result = await memberService.getAllMembers({ search }, { page, limit });
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getMemberByIdHandler(req, reply) {
    try {
        const { id } = req.params;
        const member = await memberService.getMemberById(id);
        if (!member) {
            return reply.status(404).send({ error: 'Membro não encontrado' });
        }
        return reply.send(member);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
// ==================== PLANS ====================
export async function getAllPlansHandler(req, reply) {
    try {
        const plans = await planService.getAllPlans();
        const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures');
        return reply.send({
            plans,
            availableFeatures: AVAILABLE_PLAN_FEATURES,
        });
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getPlanByIdHandler(req, reply) {
    try {
        const { id } = req.params;
        const plan = await planService.getPlanById(id);
        if (!plan) {
            return reply.status(404).send({ error: 'Plano não encontrado' });
        }
        return reply.send(plan);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function createPlanHandler(req, reply) {
    try {
        const bodySchema = z.object({
            name: z.string(),
            price: z.number(),
            features: z.array(z.string()),
            maxBranches: z.number().optional(),
            maxMembers: z.number().optional(),
            billingInterval: z.string().optional(),
        });
        const data = bodySchema.parse(req.body);
        // Validar features
        const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures');
        const validFeatureIds = AVAILABLE_PLAN_FEATURES.map((f) => f.id);
        const invalidFeatures = data.features.filter((f) => !validFeatureIds.includes(f));
        if (invalidFeatures.length > 0) {
            return reply.status(400).send({
                error: `Features inválidas: ${invalidFeatures.join(', ')}`,
            });
        }
        const adminUserId = getAdminUserId(req);
        const plan = await planService.createPlan(data, adminUserId, req);
        return reply.status(201).send(plan);
    }
    catch (error) {
        // Tratar erro de constraint única (nome duplicado)
        if (error.code === 'P2002' ||
            error.message?.includes('Unique constraint') ||
            error.message?.includes('Já existe um plano com o nome')) {
            return reply.status(409).send({
                error: error.message || 'Já existe um plano com este nome. Escolha um nome diferente.'
            });
        }
        return reply.status(500).send({ error: error.message });
    }
}
export async function updatePlanHandler(req, reply) {
    try {
        const { id } = req.params;
        const bodySchema = z.object({
            name: z.string().optional(),
            price: z.number().optional(),
            features: z.array(z.string()).optional(),
            maxBranches: z.number().optional(),
            maxMembers: z.number().optional(),
            isActive: z.boolean().optional(),
        });
        // Validar schema
        const parseResult = bodySchema.safeParse(req.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                error: 'Dados inválidos',
                details: parseResult.error.errors,
            });
        }
        const data = parseResult.data;
        // Validar features se fornecidas
        if (data.features !== undefined) {
            // Se array vazio, permitir (pode ser usado para desativar todas as features temporariamente)
            if (data.features.length > 0) {
                const { AVAILABLE_PLAN_FEATURES } = await import('../constants/planFeatures');
                const validFeatureIds = AVAILABLE_PLAN_FEATURES.map((f) => f.id);
                const invalidFeatures = data.features.filter((f) => !validFeatureIds.includes(f));
                if (invalidFeatures.length > 0) {
                    return reply.status(400).send({
                        error: `Features inválidas: ${invalidFeatures.join(', ')}`,
                    });
                }
            }
        }
        const adminUserId = getAdminUserId(req);
        const plan = await planService.updatePlan(id, data, adminUserId);
        return reply.send(plan);
    }
    catch (error) {
        // Se for erro do Prisma (plano não encontrado)
        if (error.code === 'P2025') {
            return reply.status(404).send({
                error: 'Plano não encontrado',
            });
        }
        // Log do erro para debug
        console.error('Erro ao atualizar plano:', error);
        return reply.status(500).send({
            error: error.message || 'Erro ao atualizar plano',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
export async function activatePlanHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const plan = await planService.activatePlan(id, adminUserId);
        return reply.send(plan);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function deactivatePlanHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const plan = await planService.deactivatePlan(id, adminUserId);
        return reply.send(plan);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
// ==================== SUBSCRIPTIONS ====================
export async function getAllSubscriptionsHandler(req, reply) {
    try {
        const query = req.query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const status = query.status;
        const planId = query.planId;
        const result = await subscriptionService.getAllSubscriptions({ status, planId }, { page, limit });
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getSubscriptionByIdHandler(req, reply) {
    try {
        const { id } = req.params;
        const subscription = await subscriptionService.getSubscriptionById(id);
        if (!subscription) {
            return reply.status(404).send({ error: 'Assinatura não encontrada' });
        }
        return reply.send(subscription);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function getSubscriptionHistoryHandler(req, reply) {
    try {
        const { id } = req.params;
        const history = await subscriptionService.getSubscriptionHistory(id);
        return reply.send(history);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function changeSubscriptionPlanHandler(req, reply) {
    try {
        const { id } = req.params;
        const bodySchema = z.object({
            planId: z.string(),
        });
        const { planId } = bodySchema.parse(req.body);
        const adminUserId = getAdminUserId(req);
        const subscription = await subscriptionService.changeSubscriptionPlan(id, planId, adminUserId);
        return reply.send(subscription);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function updateSubscriptionStatusHandler(req, reply) {
    try {
        const { id } = req.params;
        const bodySchema = z.object({
            status: z.string(),
        });
        const { status } = bodySchema.parse(req.body);
        const adminUserId = getAdminUserId(req);
        const subscription = await subscriptionService.updateSubscriptionStatus(id, status, adminUserId);
        return reply.send(subscription);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function cancelSubscriptionHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const subscription = await subscriptionService.cancelSubscription(id, adminUserId);
        return reply.send(subscription);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function reactivateSubscriptionHandler(req, reply) {
    try {
        const { id } = req.params;
        const adminUserId = getAdminUserId(req);
        const subscription = await subscriptionService.reactivateSubscription(id, adminUserId);
        return reply.send(subscription);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
// ==================== AUDIT ====================
export async function getAuditLogsHandler(req, reply) {
    try {
        const query = req.query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const adminUserId = query.adminUserId;
        const action = query.action;
        const startDate = query.startDate
            ? new Date(query.startDate)
            : undefined;
        const endDate = query.endDate
            ? new Date(query.endDate)
            : undefined;
        const result = await auditService.getAdminAuditLogs({ adminUserId, action, startDate, endDate }, { page, limit });
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
// ==================== CONFIG ====================
export async function getSystemConfigHandler(req, reply) {
    try {
        const config = await configService.getSystemConfig();
        return reply.send(config);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
export async function updateSystemConfigHandler(req, reply) {
    try {
        const config = req.body;
        const adminUserId = getAdminUserId(req);
        const result = await configService.updateSystemConfig(config, adminUserId);
        return reply.send(result);
    }
    catch (error) {
        return reply.status(500).send({ error: error.message });
    }
}
