import { prisma } from '../lib/prisma';
/**
 * Cria um log de auditoria
 */
export async function createAuditLog(data) {
    try {
        return await prisma.auditLog.create({
            data: {
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                userId: data.userId,
                userEmail: data.userEmail,
                userRole: data.userRole,
                description: data.description,
                metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }
    catch (error) {
        // Não deve quebrar o fluxo principal se o log falhar
        console.error('❌ Erro ao criar log de auditoria:', error);
        return null;
    }
}
/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(filters) {
    const where = {};
    if (filters.userId) {
        where.userId = filters.userId;
    }
    if (filters.entityType) {
        where.entityType = filters.entityType;
    }
    if (filters.entityId) {
        where.entityId = filters.entityId;
    }
    if (filters.action) {
        where.action = filters.action;
    }
    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
            where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
            where.createdAt.lte = filters.endDate;
        }
    }
    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: filters.limit || 100,
            skip: filters.offset || 0,
        }),
        prisma.auditLog.count({ where }),
    ]);
    return {
        logs,
        total,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
    };
}
/**
 * Busca logs de auditoria de um membro específico
 */
export async function getMemberAuditLogs(memberId, limit = 50) {
    return getAuditLogs({
        entityType: 'Member',
        entityId: memberId,
        limit,
    });
}
/**
 * Busca logs de auditoria de uma filial específica
 */
export async function getBranchAuditLogs(branchId, limit = 50) {
    return getAuditLogs({
        entityType: 'Branch',
        entityId: branchId,
        limit,
    });
}
/**
 * Busca logs de auditoria de uma igreja específica
 */
export async function getChurchAuditLogs(churchId, limit = 50) {
    return getAuditLogs({
        entityType: 'Church',
        entityId: churchId,
        limit,
    });
}
/**
 * Busca logs de auditoria de um usuário específico
 */
export async function getUserAuditLogs(userId, limit = 50) {
    return getAuditLogs({
        userId,
        limit,
    });
}
