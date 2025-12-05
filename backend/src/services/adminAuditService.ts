import { prisma } from '../lib/prisma'
import { AuditAction } from '@prisma/client'

interface AuditFilters {
  adminUserId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
}

interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Serviço de Auditoria Admin
 * Responsabilidade: Consulta e gestão de logs de auditoria
 */
export class AdminAuditService {
  async getAdminAuditLogs(
    filters: AuditFilters = {},
    pagination: PaginationParams = {}
  ) {
    const page = pagination.page || 1
    const limit = pagination.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    // Filtra apenas logs de ações administrativas
    where.action = {
      in: [
        'ADMIN_LOGIN',
        'ADMIN_LOGOUT',
        'USER_BLOCKED',
        'USER_UNBLOCKED',
        'CHURCH_SUSPENDED',
        'CHURCH_REACTIVATED',
        'PLAN_CHANGED',
        'SUBSCRIPTION_CHANGED',
        'IMPERSONATE_USER',
        'IMPERSONATE_CHURCH_OWNER',
        'PASSWORD_RESET_SENT',
        'ADMIN_CONFIG_UPDATED',
      ],
    }

    if (filters.adminUserId) {
      where.adminUserId = filters.adminUserId
    }

    if (filters.action) {
      where.action = filters.action
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          AdminUser: {
            select: {
              id: true,
              name: true,
              email: true,
              adminRole: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        admin: log.AdminUser
          ? {
              id: log.AdminUser.id,
              name: log.AdminUser.name,
              email: log.AdminUser.email,
              role: log.AdminUser.adminRole,
            }
          : null,
        description: log.description,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async logAdminAction(
    action: AuditAction,
    metadata: any,
    adminUserId: string
  ) {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
    })

    if (!admin) {
      throw new Error('Admin não encontrado')
    }

    return prisma.auditLog.create({
      data: {
        action,
        entityType: metadata.entityType || 'System',
        entityId: metadata.entityId || null,
        userId: adminUserId,
        userEmail: admin.email,
        userRole: admin.adminRole,
        description: metadata.description || `${action} realizado`,
        metadata,
        adminUserId,
      },
    })
  }
}

