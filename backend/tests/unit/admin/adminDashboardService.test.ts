// Unit tests para AdminDashboardService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AdminDashboardService } from '../../../src/services/adminDashboardService'
import { prisma } from '../../../src/lib/prisma'
import { SubscriptionStatus } from '@prisma/client'
import { subDays } from 'date-fns'

// Mock do Prisma - OBRIGATÓRIO em unit tests
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
    },
    church: {
      count: vi.fn(),
    },
    branch: {
      count: vi.fn(),
    },
    member: {
      count: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
    },
  },
}))

describe('AdminDashboardService - Unit Tests', () => {
  let service: AdminDashboardService
  const mockNow = new Date('2024-06-15T12:00:00Z')

  beforeEach(() => {
    service = new AdminDashboardService()
    vi.clearAllMocks()
    // Mock subDays para retornar datas fixas
    vi.useFakeTimers()
    vi.setSystemTime(mockNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDashboardStats', () => {
    // Teste 1: Success - Estatísticas básicas
    it('deve retornar estatísticas gerais do dashboard', async () => {
      // Arrange
      const sevenDaysAgo = subDays(mockNow, 7)
      const thirtyDaysAgo = subDays(mockNow, 30)

      vi.mocked(prisma.user.count).mockResolvedValueOnce(100) // totalUsers
      vi.mocked(prisma.church.count).mockResolvedValueOnce(50) // totalChurches
      vi.mocked(prisma.branch.count).mockResolvedValueOnce(75) // totalBranches
      vi.mocked(prisma.member.count).mockResolvedValueOnce(200) // totalMembers
      vi.mocked(prisma.user.count).mockResolvedValueOnce(10) // newUsersLast7Days
      vi.mocked(prisma.user.count).mockResolvedValueOnce(30) // newUsersLast30Days
      vi.mocked(prisma.church.count).mockResolvedValueOnce(5) // newChurchesLast7Days
      vi.mocked(prisma.church.count).mockResolvedValueOnce(15) // newChurchesLast30Days

      const mockSubscriptions = [
        {
          id: 'sub-1',
          status: SubscriptionStatus.active,
          Plan: { id: 'plan-1', name: 'Free' },
        },
        {
          id: 'sub-2',
          status: SubscriptionStatus.active,
          Plan: { id: 'plan-2', name: 'Premium' },
        },
      ]
      vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockSubscriptions as any)
      vi.mocked(prisma.church.count).mockResolvedValueOnce(40) // activeChurches

      // Act
      const stats = await service.getDashboardStats()

      // Assert
      expect(stats.totalUsers).toBe(100)
      expect(stats.totalChurches).toBe(50)
      expect(stats.totalBranches).toBe(75)
      expect(stats.totalMembers).toBe(200)
      expect(stats.newUsersLast7Days).toBe(10)
      expect(stats.newUsersLast30Days).toBe(30)
      expect(stats.newChurchesLast7Days).toBe(5)
      expect(stats.newChurchesLast30Days).toBe(15)
      expect(stats.churchesByPlan).toBeDefined()
      expect(stats.activeChurches).toBe(40)
    })

    // Teste 2: Success - Agrupamento de igrejas por plano
    it('deve agrupar corretamente igrejas por plano', async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(0)
      vi.mocked(prisma.church.count).mockResolvedValue(0)
      vi.mocked(prisma.branch.count).mockResolvedValue(0)
      vi.mocked(prisma.member.count).mockResolvedValue(0)

      const mockSubscriptions = [
        {
          id: 'sub-1',
          status: SubscriptionStatus.active,
          Plan: { id: 'plan-1', name: 'Free' },
        },
        {
          id: 'sub-2',
          status: SubscriptionStatus.active,
          Plan: { id: 'plan-2', name: 'Premium' },
        },
        {
          id: 'sub-3',
          status: SubscriptionStatus.active,
          Plan: { id: 'plan-1', name: 'Free' }, // Mesmo plano
        },
      ]
      vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockSubscriptions as any)

      // Act
      const stats = await service.getDashboardStats()

      // Assert
      expect(stats.churchesByPlan).toBeDefined()
      expect(stats.churchesByPlan.length).toBeGreaterThan(0)
      // Deve agrupar: Free = 2, Premium = 1
      const freePlan = stats.churchesByPlan.find((p) => p.planName === 'Free')
      const premiumPlan = stats.churchesByPlan.find((p) => p.planName === 'Premium')
      expect(freePlan?.count).toBe(2)
      expect(premiumPlan?.count).toBe(1)
    })

    // Teste 3: Success - Filtro de subscriptions ativas
    it('deve contar apenas subscriptions ativas para igrejas por plano', async () => {
      // Arrange
      const sevenDaysAgo = subDays(mockNow, 7)
      const thirtyDaysAgo = subDays(mockNow, 30)

      vi.mocked(prisma.user.count).mockResolvedValue(0)
      vi.mocked(prisma.church.count).mockResolvedValue(0)
      vi.mocked(prisma.branch.count).mockResolvedValue(0)
      vi.mocked(prisma.member.count).mockResolvedValue(0)

      // O service filtra por status active no findMany, então o mock só retorna ativas
      const mockSubscriptions = [
        {
          id: 'sub-1',
          status: SubscriptionStatus.active,
          Plan: { id: 'plan-1', name: 'Free' },
        },
      ]
      vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockSubscriptions as any)
      vi.mocked(prisma.church.count).mockResolvedValue(0) // activeChurches

      // Act
      const stats = await service.getDashboardStats()

      // Assert
      // findMany já filtra por status active no service, então apenas ativas são retornadas
      expect(stats.churchesByPlan.length).toBe(1)
      expect(stats.churchesByPlan[0].planName).toBe('Free')
      expect(stats.churchesByPlan[0].count).toBe(1)
      // Verifica se o findMany foi chamado com filtro de status active
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: SubscriptionStatus.active },
        })
      )
    })

    // Teste 4: Edge case - Sem dados
    it('deve retornar zero quando não há dados', async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(0)
      vi.mocked(prisma.church.count).mockResolvedValue(0)
      vi.mocked(prisma.branch.count).mockResolvedValue(0)
      vi.mocked(prisma.member.count).mockResolvedValue(0)
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([])

      // Act
      const stats = await service.getDashboardStats()

      // Assert
      expect(stats.totalUsers).toBe(0)
      expect(stats.totalChurches).toBe(0)
      expect(stats.totalBranches).toBe(0)
      expect(stats.totalMembers).toBe(0)
      expect(stats.churchesByPlan).toEqual([])
      expect(stats.activeChurches).toBe(0)
    })

    // Teste 5: Edge case - Filtros de data
    it('deve filtrar corretamente novas igrejas por intervalo de data', async () => {
      // Arrange
      const sevenDaysAgo = subDays(mockNow, 7)
      const thirtyDaysAgo = subDays(mockNow, 30)

      // Reset mocks para garantir ordem correta
      vi.clearAllMocks()

      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(5) // newUsersLast7Days
        .mockResolvedValueOnce(20) // newUsersLast30Days
      vi.mocked(prisma.church.count)
        .mockResolvedValueOnce(50) // totalChurches
        .mockResolvedValueOnce(3) // newChurchesLast7Days
        .mockResolvedValueOnce(12) // newChurchesLast30Days
        .mockResolvedValueOnce(45) // activeChurches
      vi.mocked(prisma.branch.count).mockResolvedValue(0)
      vi.mocked(prisma.member.count).mockResolvedValue(0)
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([])

      // Act
      const stats = await service.getDashboardStats()

      // Assert
      expect(stats.totalUsers).toBe(100)
      expect(stats.newUsersLast7Days).toBe(5)
      expect(stats.newUsersLast30Days).toBe(20)
      expect(stats.totalChurches).toBe(50)
      expect(stats.newChurchesLast7Days).toBe(3)
      expect(stats.newChurchesLast30Days).toBe(12)
      expect(stats.activeChurches).toBe(45)
      
      // Verifica se os filtros de data foram aplicados
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: sevenDaysAgo,
            }),
          }),
        })
      )
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: thirtyDaysAgo,
            }),
          }),
        })
      )
    })

    // Teste 6: Edge case - Igrejas ativas com filtro complexo
    it('deve contar corretamente igrejas ativas com filtros OR', async () => {
      // Arrange
      const thirtyDaysAgo = subDays(mockNow, 30)

      vi.mocked(prisma.user.count).mockResolvedValue(0)
      vi.mocked(prisma.church.count).mockResolvedValueOnce(50) // totalChurches
      vi.mocked(prisma.branch.count).mockResolvedValue(0)
      vi.mocked(prisma.member.count).mockResolvedValue(0)
      vi.mocked(prisma.church.count).mockResolvedValueOnce(0) // newChurchesLast7Days
      vi.mocked(prisma.church.count).mockResolvedValueOnce(0) // newChurchesLast30Days
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
      vi.mocked(prisma.church.count).mockResolvedValueOnce(25) // activeChurches (com filtro OR complexo)

      // Act
      const stats = await service.getDashboardStats()

      // Assert
      expect(stats.activeChurches).toBe(25)
      expect(prisma.church.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            isActive: true,
          }),
        })
      )
    })
  })
})
