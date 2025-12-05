import { prisma } from '../lib/prisma'
import { AdminRole, SubscriptionStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const JWT_SECRET = env.JWT_SECRET

interface UserFilters {
  status?: 'active' | 'blocked'
  planId?: string
  search?: string
}

interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Serviço de Usuários Admin
 * Responsabilidade: Tudo relacionado a usuários do sistema (User model)
 */
export class AdminUserService {
  /**
   * Lista todos os usuários com filtros e paginação
   */
  async getAllUsers(filters: UserFilters = {}, pagination: PaginationParams = {}) {
    const page = pagination.page || 1
    const limit = pagination.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    // Filtro por status (bloqueado)
    if (filters.status === 'blocked') {
      where.isBlocked = true
    } else if (filters.status === 'active') {
      where.isBlocked = false
    }

    // Filtro por plano
    if (filters.planId) {
      where.Subscription = {
        some: {
          planId: filters.planId,
          status: SubscriptionStatus.active,
        },
      }
    }

    // Busca por email/nome
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Subscription: {
            where: { status: SubscriptionStatus.active },
            include: {
              Plan: true,
            },
            take: 1,
            orderBy: { startedAt: 'desc' },
          },
          Member: {
            include: {
              Branch: {
                include: {
                  Church: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Formata resposta
    const formattedUsers = users.map((user) => {
      const subscription = user.Subscription[0]
      const member = user.Member

      // Conta igrejas onde é owner (via Member com role ADMINGERAL)
      const churchesAsOwner = member
        ? member.Branch?.Church
          ? [{ id: member.Branch.Church.id, name: member.Branch.Church.name }]
          : []
        : []

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        isBlocked: user.isBlocked,
        plan: subscription?.Plan ? {
          id: subscription.Plan.id,
          name: subscription.Plan.name,
        } : null,
        churchesCount: churchesAsOwner.length,
        hasMember: !!member,
      }
    })

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Detalhes completos de um usuário
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        Subscription: {
          include: {
            Plan: true,
          },
          orderBy: { startedAt: 'desc' },
        },
        Member: {
          include: {
            Branch: {
              include: {
                Church: true,
              },
            },
            Permission: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    // Igrejas onde é owner (via Member com role ADMINGERAL)
    const churchesAsOwner = user.Member && user.Member.Branch?.Church
      ? [{
          id: user.Member.Branch.Church.id,
          name: user.Member.Branch.Church.name,
          branchId: user.Member.Branch.id,
        }]
      : []

    // Igrejas onde é member
    const churchesAsMember = user.Member
      ? [{
          id: user.Member.Branch?.Church?.id || '',
          name: user.Member.Branch?.Church?.name || '',
          branchId: user.Member.branchId,
          role: user.Member.role,
        }]
      : []

    const activeSubscription = user.Subscription.find((sub) => sub.status === SubscriptionStatus.active)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      churchesAsOwner,
      churchesAsMember,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            plan: {
              id: activeSubscription.Plan.id,
              name: activeSubscription.Plan.name,
              price: activeSubscription.Plan.price,
            },
            status: activeSubscription.status,
            startedAt: activeSubscription.startedAt,
            endsAt: activeSubscription.endsAt,
          }
        : null,
      member: user.Member
        ? {
            id: user.Member.id,
            role: user.Member.role,
            permissions: user.Member.Permission.map((p) => p.type),
          }
        : null,
    }
  }

  /**
   * Bloqueia usuário
   */
  async blockUser(userId: string, adminUserId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    })

    // Registra em AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'USER_BLOCKED',
        entityType: 'User',
        entityId: userId,
        userId: adminUserId,
        userEmail: '', // Será preenchido se necessário
        description: `Usuário ${userId} foi bloqueado`,
        adminUserId,
      },
    })
  }

  /**
   * Desbloqueia usuário
   */
  async unblockUser(userId: string, adminUserId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    })

    // Registra em AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'USER_UNBLOCKED',
        entityType: 'User',
        entityId: userId,
        userId: adminUserId,
        userEmail: '',
        description: `Usuário ${userId} foi desbloqueado`,
        adminUserId,
      },
    })
  }

  /**
   * Envia link de reset de senha
   */
  async sendPasswordReset(userId: string, adminUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // Gera token de reset único
    const resetToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expira em 1 hora

    // Aqui você pode criar uma tabela PasswordResetToken ou usar campo temporário
    // Por enquanto, vamos apenas registrar a ação no log
    // Em produção, você deve armazenar o token e enviar email

    // Registra em AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_SENT',
        entityType: 'User',
        entityId: userId,
        userId: adminUserId,
        userEmail: user.email,
        description: `Link de reset de senha enviado para ${user.email}`,
        metadata: { resetToken }, // Em produção, não armazene o token no log
        adminUserId,
      },
    })

    // Em produção, você deve:
    // 1. Salvar o token em uma tabela PasswordResetToken
    // 2. Enviar email com link: /reset-password?token=...
    // 3. Nunca enviar senha em texto puro

    return { message: 'Link de reset de senha enviado (implementar envio de email)' }
  }

  /**
   * Gera token para impersonar usuário
   */
  async impersonateUser(
    userId: string,
    adminUserId: string,
    adminRole: AdminRole
  ) {
    // Verifica permissões
    if (adminRole !== 'SUPERADMIN' && adminRole !== 'SUPPORT') {
      throw new Error('Sem permissão para impersonar usuário')
    }

    // Se SUPPORT, verifica se é usuário de igreja (não AdminUser)
    if (adminRole === 'SUPPORT') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      // SUPPORT pode impersonar usuários de igreja, não outros AdminUsers
      // (Não há como SUPPORT impersonar AdminUser pois AdminUser é modelo separado)
    }

    // Busca dados do usuário para o token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Member: {
          include: {
            Branch: {
              include: {
                Church: true,
              },
            },
            Permission: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // Gera token JWT especial para impersonação
    const tokenPayload: any = {
      sub: user.id,
      email: user.email,
      name: user.name,
      type: user.Member ? 'member' : 'user',
      impersonatedByAdminId: adminUserId,
      isImpersonated: true,
    }

    if (user.Member) {
      tokenPayload.memberId = user.Member.id
      tokenPayload.role = user.Member.role
      tokenPayload.branchId = user.Member.branchId
      tokenPayload.churchId = user.Member.Branch?.Church?.id || null
      tokenPayload.permissions = user.Member.Permission?.map((p) => p.type) || []
    }

    // Token com expiração curta (30 minutos)
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30m' })

    // Registra em AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'IMPERSONATE_USER',
        entityType: 'User',
        entityId: userId,
        userId: adminUserId,
        userEmail: user.email,
        description: `Admin impersonou usuário ${user.email}`,
        metadata: { impersonatedUserId: userId },
        adminUserId,
      },
    })

    return { token, expiresIn: '30m' }
  }
}

