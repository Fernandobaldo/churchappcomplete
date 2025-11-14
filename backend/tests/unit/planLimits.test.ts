import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkPlanMembersLimit, checkPlanBranchesLimit } from '../../src/utils/planLimits'
import { prisma } from '../../src/lib/prisma'

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    branch: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('planLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkPlanMembersLimit', () => {
    const mockUserId = 'user-1'
    const mockChurchId = 'church-1'

    const mockUserWithPlan = {
      id: mockUserId,
      subscriptions: [
        {
          status: 'active',
          plan: {
            id: 'plan-1',
            name: 'Free',
            maxMembers: 10,
            maxBranches: 1,
          },
        },
      ],
      member: {
        id: 'member-1',
        branch: {
          id: 'branch-1',
          churchId: mockChurchId,
          church: {
            id: mockChurchId,
            name: 'Igreja Teste',
          },
        },
      },
    }

    it('deve permitir criar membro quando está abaixo do limite', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { members: 5 },
        },
      ])

      await expect(checkPlanMembersLimit(mockUserId)).resolves.not.toThrow()
    })

    it('deve lançar erro quando o limite de membros é excedido', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { members: 10 },
        },
      ])

      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Limite do plano atingido'
      )
    })

    it('deve permitir criar membro quando maxMembers é null (ilimitado)', async () => {
      const userWithUnlimitedPlan = {
        ...mockUserWithPlan,
        subscriptions: [
          {
            status: 'active',
            plan: {
              id: 'plan-1',
              name: 'Premium',
              maxMembers: null,
              maxBranches: null,
            },
          },
        ],
      }

      prisma.user.findUnique.mockResolvedValue(userWithUnlimitedPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { members: 100 },
        },
      ])

      await expect(checkPlanMembersLimit(mockUserId)).resolves.not.toThrow()
    })

    it('deve lançar erro quando usuário não tem plano', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        subscriptions: [],
        member: null,
      })

      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Plano não encontrado para o usuário'
      )
    })

    it('deve lançar erro quando usuário não tem igreja', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        subscriptions: [
          {
            status: 'active',
            plan: {
              id: 'plan-1',
              name: 'Free',
              maxMembers: 10,
            },
          },
        ],
        member: null,
      })

      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Igreja não encontrada para o usuário'
      )
    })

    it('deve contar membros de múltiplas branches', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { members: 5 },
        },
        {
          id: 'branch-2',
          _count: { members: 3 },
        },
      ])

      await expect(checkPlanMembersLimit(mockUserId)).resolves.not.toThrow()

      // Total: 8 membros, limite: 10, deve passar
    })

    it('deve lançar erro quando total de membros em múltiplas branches excede limite', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { members: 6 },
        },
        {
          id: 'branch-2',
          _count: { members: 5 },
        },
      ])

      // Total: 11 membros, limite: 10, deve falhar
      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Limite do plano atingido'
      )
    })
  })

  describe('checkPlanBranchesLimit', () => {
    const mockUserId = 'user-1'
    const mockChurchId = 'church-1'

    const mockUserWithPlan = {
      id: mockUserId,
      subscriptions: [
        {
          status: 'active',
          plan: {
            id: 'plan-1',
            name: 'Free',
            maxMembers: 10,
            maxBranches: 1,
          },
        },
      ],
      member: {
        id: 'member-1',
        branch: {
          id: 'branch-1',
          churchId: mockChurchId,
          church: {
            id: mockChurchId,
            name: 'Igreja Teste',
          },
        },
      },
    }

    it('deve permitir criar branch quando está abaixo do limite', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.count.mockResolvedValue(0)

      await expect(checkPlanBranchesLimit(mockUserId)).resolves.not.toThrow()
    })

    it('deve lançar erro quando o limite de branches é excedido', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.count.mockResolvedValue(1)

      await expect(checkPlanBranchesLimit(mockUserId)).rejects.toThrow(
        'Limite do plano atingido'
      )
    })

    it('deve permitir criar branch quando maxBranches é null (ilimitado)', async () => {
      const userWithUnlimitedPlan = {
        ...mockUserWithPlan,
        subscriptions: [
          {
            status: 'active',
            plan: {
              id: 'plan-1',
              name: 'Premium',
              maxMembers: null,
              maxBranches: null,
            },
          },
        ],
      }

      prisma.user.findUnique.mockResolvedValue(userWithUnlimitedPlan)
      prisma.branch.count.mockResolvedValue(10)

      await expect(checkPlanBranchesLimit(mockUserId)).resolves.not.toThrow()
    })

    it('deve lançar erro quando usuário não tem plano', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        subscriptions: [],
        member: null,
      })

      await expect(checkPlanBranchesLimit(mockUserId)).rejects.toThrow(
        'Plano não encontrado para o usuário'
      )
    })

    it('deve lançar erro quando usuário não tem igreja', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        subscriptions: [
          {
            status: 'active',
            plan: {
              id: 'plan-1',
              name: 'Free',
              maxBranches: 1,
            },
          },
        ],
        member: null,
      })

      await expect(checkPlanBranchesLimit(mockUserId)).rejects.toThrow(
        'Igreja não encontrada para o usuário'
      )
    })
  })
})

