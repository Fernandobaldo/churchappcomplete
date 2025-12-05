import { prisma } from '../lib/prisma'
import { SubscriptionStatus } from '@prisma/client'
import { subDays } from 'date-fns'

/**
 * Serviço de Dashboard Admin
 * Responsabilidade: Apenas estatísticas e métricas do dashboard
 */
export class AdminDashboardService {
  /**
   * Retorna estatísticas gerais do dashboard
   */
  async getDashboardStats() {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)

    // Totais básicos
    const [
      totalUsers,
      totalChurches,
      totalBranches,
      totalMembers,
      newUsersLast7Days,
      newUsersLast30Days,
      newChurchesLast7Days,
      newChurchesLast30Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.church.count(),
      prisma.branch.count(),
      prisma.member.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      // Conta igrejas criadas nos últimos 7 dias
      prisma.church.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      // Conta igrejas criadas nos últimos 30 dias
      prisma.church.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ])

    // Igrejas por plano - simplificado
    // Busca todas as assinaturas ativas e agrupa por plano
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.active,
      },
      include: {
        Plan: true,
      },
    })

    // Agrupa assinaturas por plano (cada assinatura = 1 igreja, pois cada User tem 1 igreja)
    const churchesByPlanMap = new Map<string, number>()
    subscriptions.forEach((sub) => {
      const planName = sub.Plan.name
      const currentCount = churchesByPlanMap.get(planName) || 0
      churchesByPlanMap.set(planName, currentCount + 1)
    })

    const churchesByPlanArray = Array.from(churchesByPlanMap.entries()).map(
      ([planName, count]) => ({
        planName,
        count,
      })
    )

    // Igrejas ativas (que foram atualizadas recentemente ou têm membros criados recentemente)
    const activeChurches = await prisma.church.count({
      where: {
        OR: [
          {
            updatedAt: {
              gte: thirtyDaysAgo,
            },
          },
          {
            Branch: {
              some: {
                Member: {
                  some: {
                    createdAt: {
                      gte: thirtyDaysAgo,
                    },
                  },
                },
              },
            },
          },
        ],
        isActive: true,
      },
    })

    return {
      totalUsers,
      totalChurches,
      totalBranches,
      totalMembers,
      newUsersLast7Days,
      newUsersLast30Days,
      newChurchesLast7Days,
      newChurchesLast30Days,
      churchesByPlan: churchesByPlanArray,
      activeChurches,
    }
  }
}

