import { prisma } from '../lib/prisma'

interface MemberFilters {
  search?: string
}

interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Serviço de Membros Admin
 * Responsabilidade: Visão global de membros
 */
export class AdminMemberService {
  async getAllMembers(filters: MemberFilters = {}, pagination: PaginationParams = {}) {
    const page = pagination.page || 1
    const limit = pagination.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        {
          Branch: {
            Church: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
      ]
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Branch: {
            include: {
              Church: true,
            },
          },
        },
      }),
      prisma.member.count({ where }),
    ])

    return {
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        church: {
          id: m.Branch?.Church?.id || '',
          name: m.Branch?.Church?.name || '',
        },
        branch: {
          id: m.branchId,
          name: m.Branch?.name || '',
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getMemberById(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        Branch: {
          include: {
            Church: true,
          },
        },
        Permission: true,
        Position: true,
      },
    })

    if (!member) {
      return null
    }

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      church: member.Branch?.Church
        ? {
            id: member.Branch.Church.id,
            name: member.Branch.Church.name,
          }
        : null,
      branch: {
        id: member.branchId,
        name: member.Branch?.name || '',
      },
      permissions: member.Permission.map((p) => p.type),
      position: member.Position
        ? {
            id: member.Position.id,
            name: member.Position.name,
          }
        : null,
    }
  }
}

