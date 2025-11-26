import { createAuditLog } from '../services/auditService';
import { AuditAction } from '@prisma/client';
/**
 * Obtém informações do usuário e requisição para auditoria
 */
export function getAuditContext(request, fallbackUserId, fallbackEmail) {
    const user = request.user;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];
    return {
        userId: user?.userId || fallbackUserId || 'unknown',
        userEmail: user?.email || fallbackEmail || 'unknown',
        userRole: user?.role || null,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent: userAgent || undefined,
    };
}
/**
 * Cria um log de auditoria de forma simplificada
 */
export async function logAudit(request, action, entityType, description, options) {
    const context = getAuditContext(request, options?.userId, options?.userEmail);
    return createAuditLog({
        action,
        entityType,
        entityId: options?.entityId,
        userId: options?.userId || context.userId,
        userEmail: options?.userEmail || context.userEmail,
        userRole: context.userRole || undefined,
        description,
        metadata: options?.metadata,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
    });
}
/**
 * Logs pré-configurados para ações comuns
 */
export const AuditLogger = {
    /**
     * Log de criação de membro
     */
    async memberCreated(request, memberId, memberEmail, role, branchId) {
        return logAudit(request, AuditAction.MEMBER_CREATED, 'Member', `Membro criado: ${memberEmail} com role ${role}`, {
            entityId: memberId,
            metadata: {
                memberEmail,
                role,
                branchId,
            },
        });
    },
    /**
     * Log de atualização de membro
     */
    async memberUpdated(request, memberId, changes) {
        return logAudit(request, AuditAction.MEMBER_UPDATED, 'Member', `Membro atualizado: ${memberId}`, {
            entityId: memberId,
            metadata: { changes },
        });
    },
    /**
     * Log de mudança de role
     */
    async memberRoleChanged(request, memberId, oldRole, newRole) {
        return logAudit(request, AuditAction.MEMBER_ROLE_CHANGED, 'Member', `Role alterado de ${oldRole} para ${newRole}`, {
            entityId: memberId,
            metadata: { oldRole, newRole },
        });
    },
    /**
     * Log de mudança de permissões
     */
    async memberPermissionsChanged(request, memberId, permissions) {
        return logAudit(request, AuditAction.MEMBER_PERMISSIONS_CHANGED, 'Member', `Permissões alteradas para membro ${memberId}`, {
            entityId: memberId,
            metadata: { permissions },
        });
    },
    /**
     * Log de criação de branch
     */
    async branchCreated(request, branchId, branchName, churchId) {
        return logAudit(request, AuditAction.BRANCH_CREATED, 'Branch', `Filial criada: ${branchName}`, {
            entityId: branchId,
            metadata: { branchName, churchId },
        });
    },
    /**
     * Log de criação de igreja
     */
    async churchCreated(request, churchId, churchName) {
        return logAudit(request, AuditAction.CHURCH_CREATED, 'Church', `Igreja criada: ${churchName}`, {
            entityId: churchId,
            metadata: { churchName },
        });
    },
    /**
     * Log de tentativa de acesso não autorizado
     */
    async unauthorizedAccessAttempt(request, action, reason) {
        return logAudit(request, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'Security', `Tentativa de acesso não autorizado: ${action}`, {
            metadata: { action, reason },
        });
    },
    /**
     * Log de limite de plano excedido
     */
    async planLimitExceeded(request, limitType, current, max) {
        return logAudit(request, AuditAction.PLAN_LIMIT_EXCEEDED, 'Plan', `Limite de ${limitType} excedido: ${current}/${max}`, {
            metadata: { limitType, current, max },
        });
    },
};
