import { FastifyRequest } from 'fastify'
import { createAuditLog, AuditLogData } from '../services/auditService'
import { AuditAction } from '@prisma/client'

/**
 * Obtém informações do usuário e requisição para auditoria
 */
export function getAuditContext(request: FastifyRequest, fallbackUserId?: string, fallbackEmail?: string) {
  const user = request.user
  const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress
  const userAgent = request.headers['user-agent']

  return {
    userId: user?.userId || fallbackUserId || 'unknown',
    userEmail: user?.email || fallbackEmail || 'unknown',
    userRole: user?.role || null,
    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    userAgent: userAgent || undefined,
  }
}

/**
 * Cria um log de auditoria de forma simplificada
 */
export async function logAudit(
  request: FastifyRequest,
  action: AuditAction,
  entityType: string,
  description: string,
  options?: {
    entityId?: string
    metadata?: Record<string, any>
    userId?: string
    userEmail?: string
  }
) {
  const context = getAuditContext(request, options?.userId, options?.userEmail)

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
  })
}

/**
 * Logs pré-configurados para ações comuns
 */
export const AuditLogger = {
  /**
   * Log de criação de membro
   */
  async memberCreated(
    request: FastifyRequest,
    memberId: string,
    memberEmail: string,
    role: string,
    branchId: string
  ) {
    return logAudit(
      request,
      AuditAction.MEMBER_CREATED,
      'Member',
      `Membro criado: ${memberEmail} com role ${role}`,
      {
        entityId: memberId,
        metadata: {
          memberEmail,
          role,
          branchId,
        },
      }
    )
  },

  /**
   * Log de atualização de membro
   */
  async memberUpdated(
    request: FastifyRequest,
    memberId: string,
    changes: Record<string, any>
  ) {
    return logAudit(
      request,
      AuditAction.MEMBER_UPDATED,
      'Member',
      `Membro atualizado: ${memberId}`,
      {
        entityId: memberId,
        metadata: { changes },
      }
    )
  },

  /**
   * Log de mudança de role
   */
  async memberRoleChanged(
    request: FastifyRequest,
    memberId: string,
    oldRole: string,
    newRole: string
  ) {
    return logAudit(
      request,
      AuditAction.MEMBER_ROLE_CHANGED,
      'Member',
      `Role alterado de ${oldRole} para ${newRole}`,
      {
        entityId: memberId,
        metadata: { oldRole, newRole },
      }
    )
  },

  /**
   * Log de mudança de permissões
   */
  async memberPermissionsChanged(
    request: FastifyRequest,
    memberId: string,
    permissions: string[]
  ) {
    return logAudit(
      request,
      AuditAction.MEMBER_PERMISSIONS_CHANGED,
      'Member',
      `Permissões alteradas para membro ${memberId}`,
      {
        entityId: memberId,
        metadata: { permissions },
      }
    )
  },

  /**
   * Log de criação de branch
   */
  async branchCreated(
    request: FastifyRequest,
    branchId: string,
    branchName: string,
    churchId: string
  ) {
    return logAudit(
      request,
      AuditAction.BRANCH_CREATED,
      'Branch',
      `Filial criada: ${branchName}`,
      {
        entityId: branchId,
        metadata: { branchName, churchId },
      }
    )
  },

  /**
   * Log de criação de igreja
   */
  async churchCreated(
    request: FastifyRequest,
    churchId: string,
    churchName: string
  ) {
    return logAudit(
      request,
      AuditAction.CHURCH_CREATED,
      'Church',
      `Igreja criada: ${churchName}`,
      {
        entityId: churchId,
        metadata: { churchName },
      }
    )
  },

  /**
   * Log de tentativa de acesso não autorizado
   */
  async unauthorizedAccessAttempt(
    request: FastifyRequest,
    action: string,
    reason: string
  ) {
    return logAudit(
      request,
      AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
      'Security',
      `Tentativa de acesso não autorizado: ${action}`,
      {
        metadata: { action, reason },
      }
    )
  },

  /**
   * Log de limite de plano excedido
   */
  async planLimitExceeded(
    request: FastifyRequest,
    limitType: 'members' | 'branches',
    current: number,
    max: number
  ) {
    return logAudit(
      request,
      AuditAction.PLAN_LIMIT_EXCEEDED,
      'Plan',
      `Limite de ${limitType} excedido: ${current}/${max}`,
      {
        metadata: { limitType, current, max },
      }
    )
  },
}

