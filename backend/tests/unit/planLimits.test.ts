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
    member: {
      findFirst: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
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
      Subscription: [
        {
          status: 'active',
          Plan: {
            id: 'plan-1',
            name: 'Free',
            maxMembers: 10,
            maxBranches: 1,
          },
        },
      ],
      Member: {
        id: 'member-1',
        Branch: {
          id: 'branch-1',
          churchId: mockChurchId,
          church: {
            id: mockChurchId,
            name: 'Igreja Teste',
          },
        },
      },
    }

    // Teste 1: Success - Abaixo do limite
    it('deve permitir criar membro quando está abaixo do limite', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { Member: 5 },
        },
      ])

      // Act & Assert
      await expect(checkPlanMembersLimit(mockUserId)).resolves.not.toThrow()
    })

    // Teste 2: Validation failure - Limite excedido
    it('deve lançar erro quando o limite de membros é excedido', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { Member: 10 },
        },
      ])

      // Act & Assert
      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Limite do plano atingido'
      )
    })

    // Teste 3: Edge case #1 - Plano ilimitado (maxMembers null)
    it('deve permitir criar membro quando maxMembers é null (ilimitado)', async () => {
      // Arrange
      const userWithUnlimitedPlan = {
        ...mockUserWithPlan,
        Subscription: [
          {
            status: 'active',
            Plan: {
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
          _count: { Member: 100 },
        },
      ])

      // Act & Assert
      await expect(checkPlanMembersLimit(mockUserId)).resolves.not.toThrow()
    })

    // Teste adicional: Edge case - Usuário sem plano
    it('deve lançar erro quando usuário não tem plano', async () => {
      // Arrange
      // Usuário com Member e Branch, mas sem Subscription (sem plano próprio)
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        Subscription: [],
        Member: {
          id: 'member-1',
          Branch: {
            id: 'branch-1',
            churchId: mockChurchId,
          },
        },
      })

      // Quando busca o plano do ADMINGERAL, também não encontra
      prisma.member.findFirst.mockResolvedValue(null)
      
      // Mock necessário porque código pode tentar buscar subscriptions do admin
      prisma.subscription.findMany.mockResolvedValue([])
      
      // Mock necessário porque código busca branches mesmo quando lança erro de plano
      prisma.branch.findMany.mockResolvedValue([])

      // Act & Assert
      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Plano não encontrado para o usuário ou para a igreja'
      )
    })

    // Teste 4: Edge case #2 - Usuário sem igreja
    it('deve lançar erro quando usuário não tem igreja', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        Subscription: [
          {
            status: 'active',
            Plan: {
              id: 'plan-1',
              name: 'Free',
              maxMembers: 10,
            },
          },
        ],
        Member: null,
      })

      // Act & Assert
      await expect(checkPlanMembersLimit(mockUserId)).rejects.toThrow(
        'Igreja não encontrada para o usuário'
      )
    })

    // Teste 5: Edge case #3 - Múltiplas branches
    it('deve contar membros de múltiplas branches', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { Member: 5 },
        },
        {
          id: 'branch-2',
          _count: { Member: 3 },
        },
      ])

      // Act & Assert
      // Total: 8 membros, limite: 10, deve passar
      await expect(checkPlanMembersLimit(mockUserId)).resolves.not.toThrow()
    })

    // Teste 6: Validation failure - Limite excedido em múltiplas branches
    it('deve lançar erro quando total de membros em múltiplas branches excede limite', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          _count: { Member: 6 },
        },
        {
          id: 'branch-2',
          _count: { Member: 5 },
        },
      ])

      // Act & Assert
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
      Subscription: [
        {
          status: 'active',
          Plan: {
            id: 'plan-1',
            name: 'Free',
            maxMembers: 10,
            maxBranches: 1,
          },
        },
      ],
      Member: {
        id: 'member-1',
        Branch: {
          id: 'branch-1',
          churchId: mockChurchId,
          church: {
            id: mockChurchId,
            name: 'Igreja Teste',
          },
        },
      },
    }

    // Teste 1: Success - Abaixo do limite de branches
    it('deve permitir criar branch quando está abaixo do limite', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.count.mockResolvedValue(0)

      // Act & Assert
      await expect(checkPlanBranchesLimit(mockUserId)).resolves.not.toThrow()
    })

    // Teste 2: Validation failure - Limite de branches excedido
    it('deve lançar erro quando o limite de branches é excedido', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUserWithPlan)
      prisma.branch.count.mockResolvedValue(1)

      // Act & Assert
      await expect(checkPlanBranchesLimit(mockUserId)).rejects.toThrow(
        'Limite do plano atingido'
      )
    })

    // Teste 3: Edge case #1 - Plano ilimitado (maxBranches null)
    it('deve permitir criar branch quando maxBranches é null (ilimitado)', async () => {
      // Arrange
      const userWithUnlimitedPlan = {
        ...mockUserWithPlan,
        Subscription: [
          {
            status: 'active',
            Plan: {
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

      // Act & Assert
      await expect(checkPlanBranchesLimit(mockUserId)).resolves.not.toThrow()
    })

    // Teste 4: Edge case #2 - Usuário sem plano
    it('deve lançar erro quando usuário não tem plano', async () => {
      // Arrange
      const mockChurchId = 'church-1'
      
      // Usuário com Member e Branch, mas sem Subscription (sem plano próprio)
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        Subscription: [],
        Member: {
          id: 'member-1',
          Branch: {
            id: 'branch-1',
            churchId: mockChurchId,
          },
        },
      })

      // Quando busca o plano do ADMINGERAL, também não encontra
      prisma.member.findFirst.mockResolvedValue(null)
      
      // Mock necessário porque código pode tentar buscar subscriptions do admin
      prisma.subscription.findMany.mockResolvedValue([])
      
      // Mock necessário porque código busca branches mesmo quando lança erro de plano
      prisma.branch.count.mockResolvedValue(0)

      // Act & Assert
      await expect(checkPlanBranchesLimit(mockUserId)).rejects.toThrow(
        'Plano não encontrado para o usuário ou para a igreja'
      )
    })

    // Teste 5: Edge case #3 - Usuário sem igreja
    it('deve lançar erro quando usuário não tem igreja', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        Subscription: [
          {
            status: 'active',
            Plan: {
              id: 'plan-1',
              name: 'Free',
              maxBranches: 1,
            },
          },
        ],
        Member: null,
      })

      // Act & Assert
      await expect(checkPlanBranchesLimit(mockUserId)).rejects.toThrow(
        'Igreja não encontrada para o usuário'
      )
    })
  })
})

