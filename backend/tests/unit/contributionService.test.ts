// Unit tests para ContributionService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContributionService } from '../../src/services/contributionService'
import { prisma } from '../../src/lib/prisma'

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    contribution: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    paymentMethod: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

const contributionService = new ContributionService()

describe('ContributionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getByBranch', () => {
    // Teste 1: Success - Retornar lista de contribuições
    it('deve retornar lista de contribuições para uma branch', async () => {
      // Arrange
      const branchId = 'branch-1'
      const mockContributions = [
        {
          id: 'contribution-1',
          title: 'Campanha Teste',
          branchId,
          PaymentMethods: [],
        },
      ]
      ;(prisma.contribution.findMany as any).mockResolvedValue(mockContributions)

      // Act
      const result = await contributionService.getByBranch(branchId)

      // Assert
      expect(result).toEqual(mockContributions)
      expect(prisma.contribution.findMany).toHaveBeenCalledWith({
        where: { branchId },
        include: { PaymentMethods: true },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('getById', () => {
    // Teste 2: Success - Retornar contribuição por ID
    it('deve retornar contribuição quando encontrada', async () => {
      // Arrange
      const id = 'contribution-1'
      const mockContribution = {
        id,
        title: 'Campanha Teste',
        branchId: 'branch-1',
        Branch: { id: 'branch-1' },
        PaymentMethods: [],
      }
      ;(prisma.contribution.findUnique as any).mockResolvedValue(mockContribution)

      // Act
      const result = await contributionService.getById(id)

      // Assert
      expect(result).toEqual(mockContribution)
      expect(prisma.contribution.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          Branch: { select: { churchId: true, id: true, name: true } },
          PaymentMethods: true,
        },
      })
    })

    // Teste 3: Error - Retornar null quando não encontrada
    it('deve retornar null quando contribuição não encontrada', async () => {
      // Arrange
      const id = 'non-existent'
      ;(prisma.contribution.findUnique as any).mockResolvedValue(null)

      // Act
      const result = await contributionService.getById(id)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    // Teste 4: Success - Criar contribuição com dados válidos
    it('deve criar contribuição com dados válidos', async () => {
      // Arrange
      const input = {
        title: 'Campanha Teste',
        description: 'Descrição teste',
        goal: 1000,
        endDate: '2024-12-31T00:00:00.000Z',
        isActive: true,
        branchId: 'branch-1',
      }
      const mockCreated = {
        id: 'contribution-1',
        ...input,
        endDate: new Date(input.endDate),
        PaymentMethods: [],
      }
      ;(prisma.contribution.create as any).mockResolvedValue(mockCreated)
      ;(prisma.paymentMethod.createMany as any).mockResolvedValue({ count: 0 })

      // Act
      const result = await contributionService.create(input)

      // Assert
      expect(result).toEqual(mockCreated)
      expect(prisma.contribution.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: input.description,
          goal: input.goal,
          endDate: new Date(input.endDate),
          isActive: input.isActive,
          branchId: input.branchId,
        },
        include: { PaymentMethods: true },
      })
    })

    // Teste 5: Success - Criar contribuição com endDate em formato ISO string
    it('deve criar contribuição com endDate como string ISO', async () => {
      // Arrange
      const input = {
        title: 'Campanha Teste',
        endDate: '2024-12-31T00:00:00.000Z',
        branchId: 'branch-1',
      }
      const mockCreated = {
        id: 'contribution-1',
        ...input,
        endDate: new Date(input.endDate),
        PaymentMethods: [],
      }
      ;(prisma.contribution.create as any).mockResolvedValue(mockCreated)
      ;(prisma.paymentMethod.createMany as any).mockResolvedValue({ count: 0 })

      // Act
      const result = await contributionService.create(input)

      // Assert
      expect(prisma.contribution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endDate: expect.any(Date),
          }),
        })
      )
    })

    // Teste 6: Success - Criar contribuição sem endDate
    it('deve criar contribuição sem endDate quando não fornecido', async () => {
      // Arrange
      const input = {
        title: 'Campanha Teste',
        branchId: 'branch-1',
      }
      const mockCreated = {
        id: 'contribution-1',
        ...input,
        endDate: null,
        PaymentMethods: [],
      }
      ;(prisma.contribution.create as any).mockResolvedValue(mockCreated)
      ;(prisma.paymentMethod.createMany as any).mockResolvedValue({ count: 0 })

      // Act
      const result = await contributionService.create(input)

      // Assert
      expect(result).toEqual(mockCreated)
      expect(prisma.contribution.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: undefined,
          goal: undefined,
          endDate: null,
          isActive: true,
          branchId: input.branchId,
        },
        include: { PaymentMethods: true },
      })
    })
  })
})

