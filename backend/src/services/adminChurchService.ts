import { prisma } from '../lib/prisma'
import { AdminRole, SubscriptionStatus } from '@prisma/client'
import { AdminUserService } from './adminUserService'

interface ChurchFilters {
  name?: string
  planId?: string
  status?: 'active' | 'suspended'
}

interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Serviço de Igrejas Admin
 * Responsabilidade: Tudo relacionado a igrejas (Church model)
 */
export class AdminChurchService {
  private userService = new AdminUserService()

  async getAllChurches(filters: ChurchFilters = {}, pagination: PaginationParams = {}) {
    const page = pagination.page || 1
    const limit = pagination.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' }
    }

    if (filters.status === 'suspended') {
      where.isActive = false
    } else if (filters.status === 'active') {
      where.isActive = true
    }

    const [churches, total] = await Promise.all([
      prisma.church.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Branch: {
            include: {
              Member: true,
            },
          },
        },
      }),
      prisma.church.count({ where }),
    ])

    // Busca donos das igrejas e planos
    const churchesWithDetails = await Promise.all(
      churches.map(async (church) => {
        // Encontra o dono (Member com role ADMINGERAL na primeira branch)
        const mainBranch = church.Branch.find((b) => b.isMainBranch) || church.Branch[0]
        const owner = mainBranch
          ? await prisma.member.findFirst({
              where: {
                branchId: mainBranch.id,
                role: 'ADMINGERAL',
              },
              include: {
                User: true,
              },
            })
          : null

        // Busca assinatura do dono
        const subscription = owner?.User
          ? await prisma.subscription.findFirst({
              where: {
                userId: owner.User.id,
                status: SubscriptionStatus.active,
              },
              include: {
                Plan: true,
              },
            })
          : null

        const totalMembers = church.Branch.reduce(
          (sum, branch) => sum + branch.Member.length,
          0
        )

        return {
          id: church.id,
          name: church.name,
          address: church.address,
          isActive: church.isActive,
          owner: owner?.User
            ? {
                id: owner.User.id,
                name: owner.User.firstName && owner.User.lastName 
                  ? `${owner.User.firstName} ${owner.User.lastName}`.trim()
                  : owner.User.firstName || owner.User.lastName || 'Usuário',
                email: owner.User.email,
              }
            : null,
          plan: subscription?.Plan
            ? {
                id: subscription.Plan.id,
                name: subscription.Plan.name,
              }
            : null,
          branchesCount: church.Branch.length,
          membersCount: totalMembers,
        }
      })
    )

    return {
      churches: churchesWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getChurchById(id: string) {
    const church = await prisma.church.findUnique({
      where: { id },
      include: {
        Branch: {
          include: {
            Member: true,
          },
        },
        Positions: true,
      },
    })

    if (!church) {
      return null
    }

    // Encontra o dono
    const mainBranch = church.Branch.find((b) => b.isMainBranch) || church.Branch[0]
    const owner = mainBranch
      ? await prisma.member.findFirst({
          where: {
            branchId: mainBranch.id,
            role: 'ADMINGERAL',
          },
          include: {
            User: {
              include: {
                Subscription: {
                  where: { status: SubscriptionStatus.active },
                  include: {
                    Plan: true,
                  },
                  take: 1,
                },
              },
            },
          },
        })
      : null

    const subscription = owner?.User?.Subscription[0]

    const branches = church.Branch.map((branch) => ({
      id: branch.id,
      name: branch.name,
      isMainBranch: branch.isMainBranch,
      membersCount: branch.Member.length,
    }))

    const totalMembers = church.Branch.reduce(
      (sum, branch) => sum + branch.Member.length,
      0
    )

    return {
      id: church.id,
      name: church.name,
      logoUrl: church.logoUrl,
      avatarUrl: church.avatarUrl,
      address: church.address,
      phone: church.phone,
      email: church.email,
      website: church.website,
      isActive: church.isActive,
      owner: owner?.User
        ? {
            id: owner.User.id,
            name: owner.User.firstName && owner.User.lastName 
              ? `${owner.User.firstName} ${owner.User.lastName}`.trim()
              : owner.User.firstName || owner.User.lastName || 'Usuário',
            email: owner.User.email,
          }
        : null,
      plan: subscription
        ? {
            id: subscription.Plan.id,
            name: subscription.Plan.name,
            price: subscription.Plan.price,
          }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startedAt: subscription.startedAt,
            endsAt: subscription.endsAt,
          }
        : null,
      branches,
      membersCount: totalMembers,
    }
  }

  async getChurchBranches(churchId: string) {
    const branches = await prisma.branch.findMany({
      where: { churchId },
      include: {
        Member: true,
      },
    })

    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      isMainBranch: branch.isMainBranch,
      membersCount: branch.Member.length,
    }))
  }

  async getChurchMembers(churchId: string, pagination: PaginationParams = {}) {
    const page = pagination.page || 1
    const limit = pagination.limit || 50
    const skip = (page - 1) * limit

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: {
          Branch: {
            churchId,
          },
        },
        skip,
        take: limit,
        include: {
          Branch: true,
        },
      }),
      prisma.member.count({
        where: {
          Branch: {
            churchId,
          },
        },
      }),
    ])

    return {
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        branchId: m.branchId,
        branchName: m.Branch.name,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async suspendChurch(churchId: string, adminUserId: string) {
    await prisma.church.update({
      where: { id: churchId },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CHURCH_SUSPENDED',
        entityType: 'Church',
        entityId: churchId,
        userId: adminUserId,
        userEmail: '',
        description: `Igreja ${churchId} foi suspensa`,
        adminUserId,
      },
    })
  }

  async reactivateChurch(churchId: string, adminUserId: string) {
    await prisma.church.update({
      where: { id: churchId },
      data: { isActive: true },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CHURCH_REACTIVATED',
        entityType: 'Church',
        entityId: churchId,
        userId: adminUserId,
        userEmail: '',
        description: `Igreja ${churchId} foi reativada`,
        adminUserId,
      },
    })
  }

  async changeChurchPlan(churchId: string, planId: string, adminUserId: string) {
    // Encontra o dono da igreja
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      include: {
        Branch: {
          take: 1,
        },
      },
    })

    if (!church) {
      throw new Error('Igreja não encontrada')
    }

    const mainBranch = church.Branch[0]
    if (!mainBranch) {
      throw new Error('Igreja sem filiais')
    }

    const owner = await prisma.member.findFirst({
      where: {
        branchId: mainBranch.id,
        role: 'ADMINGERAL',
      },
      include: {
        User: true,
      },
    })

    if (!owner?.User) {
      throw new Error('Dono da igreja não encontrado')
    }

    // Busca assinatura ativa atual
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: owner.User.id,
        status: SubscriptionStatus.active,
      },
      include: {
        Plan: true,
      },
    })

    const oldPlanId = currentSubscription?.planId

    // Atualiza ou cria assinatura
    if (currentSubscription) {
      await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: { planId },
      })
    } else {
      await prisma.subscription.create({
        data: {
          userId: owner.User.id,
          planId,
          status: SubscriptionStatus.active,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        action: 'PLAN_CHANGED',
        entityType: 'Church',
        entityId: churchId,
        userId: adminUserId,
        userEmail: '',
        description: `Plano da igreja ${churchId} foi alterado`,
        metadata: { churchId, oldPlanId, newPlanId: planId },
        adminUserId,
      },
    })
  }

  async impersonateChurchOwner(churchId: string, adminUserId: string, adminRole: AdminRole) {
    if (adminRole !== 'SUPERADMIN' && adminRole !== 'SUPPORT') {
      throw new Error('Sem permissão para impersonar dono de igreja')
    }

    // Encontra o dono
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      include: {
        Branch: {
          take: 1,
        },
      },
    })

    if (!church) {
      throw new Error('Igreja não encontrada')
    }

    const mainBranch = church.Branch[0]
    const owner = await prisma.member.findFirst({
      where: {
        branchId: mainBranch.id,
        role: 'ADMINGERAL',
      },
      include: {
        User: true,
      },
    })

    if (!owner?.User) {
      throw new Error('Dono da igreja não encontrado')
    }

    // Usa o serviço de usuários para impersonar
    const token = await this.userService.impersonateUser(
      owner.User.id,
      adminUserId,
      adminRole
    )

    await prisma.auditLog.create({
      data: {
        action: 'IMPERSONATE_CHURCH_OWNER',
        entityType: 'Church',
        entityId: churchId,
        userId: adminUserId,
        userEmail: '',
        description: `Admin impersonou dono da igreja ${churchId}`,
        metadata: { churchId, ownerUserId: owner.User.id },
        adminUserId,
      },
    })

    return token
  }
}

