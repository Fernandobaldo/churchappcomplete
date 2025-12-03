import { prisma } from '../lib/prisma'
import { PaymentMethodType } from '@prisma/client'

interface PaymentMethodInput {
  type: PaymentMethodType
  data: Record<string, any>
}

interface CreateContributionInput {
  title: string
  description?: string
  goal?: number
  endDate?: string
  paymentMethods?: PaymentMethodInput[]
  isActive?: boolean
  branchId: string
}

export class ContributionService {
  async getByBranch(branchId: string) {
    return prisma.contribution.findMany({
      where: { branchId },
      include: {
        PaymentMethods: true,
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getById(id: string) {
    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            churchId: true,
          },
        },
        PaymentMethods: true,
      },
    })
    return contribution
  }

  async create(data: CreateContributionInput) {
    const contribution = await prisma.contribution.create({
      data: {
        title: data.title,
        description: data.description,
        goal: data.goal,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
        branchId: data.branchId,
        PaymentMethods: data.paymentMethods
          ? {
              create: data.paymentMethods.map((pm) => ({
                type: pm.type,
                data: pm.data,
              })),
            }
          : undefined,
      },
      include: {
        PaymentMethods: true,
      },
    })
    
    return contribution
  }

  async toggleActive(id: string) {
    const contribution = await prisma.contribution.findUnique({
      where: { id },
    })

    if (!contribution) {
      throw new Error('Contribuição não encontrada')
    }

    return prisma.contribution.update({
      where: { id },
      data: {
        isActive: !contribution.isActive,
      },
      include: {
        PaymentMethods: true,
      },
    })
  }

  async getActiveCount(branchId: string) {
    return prisma.contribution.count({
      where: {
        branchId,
        isActive: true,
      },
    })
  }
}
