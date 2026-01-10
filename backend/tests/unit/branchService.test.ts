// Unit tests para BranchService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as branchService from '../../src/services/branchService'
import { prisma } from '../../src/lib/prisma'
import { checkPlanBranchesLimit } from '../../src/utils/planLimits'
import { getMemberFromUserId } from '../../src/utils/authorization'

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    branch: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    church: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock das dependências
vi.mock('../../src/utils/planLimits', () => ({
  checkPlanBranchesLimit: vi.fn(),
}))

vi.mock('../../src/utils/authorization', () => ({
  getMemberFromUserId: vi.fn(),
}))

describe('BranchService - Unit Tests', () => {
  const mockChurchId = 'church-test-123'
  const mockBranchId = 'branch-test-456'
  const mockCreatorUserId = 'user-test-789'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Teste 1: Success - Criar branch
  it('deve criar branch com sucesso', async () => {
    // Arrange
    const mockBranch = {
      id: mockBranchId,
      name: 'Filial Teste',
      churchId: mockChurchId,
      isMainBranch: false,
    }

    ;(prisma.church.findUnique as any).mockResolvedValue({
      id: mockChurchId,
      name: 'Igreja Teste',
    })
    ;(prisma.branch.create as any).mockResolvedValue(mockBranch)

    // Act
    const result = await branchService.createBranch({
      name: 'Filial Teste',
      churchId: mockChurchId,
    })

    // Assert
    expect(result).toEqual(mockBranch)
    expect(prisma.church.findUnique).toHaveBeenCalledWith({
      where: { id: mockChurchId },
    })
    expect(prisma.branch.create).toHaveBeenCalledWith({
      data: {
        name: 'Filial Teste',
        churchId: mockChurchId,
      },
    })
  })

  // Teste 2: Validation failure - Igreja não encontrada
  it('deve lançar erro se igreja não existir', async () => {
    // Arrange
    ;(prisma.church.findUnique as any).mockResolvedValue(null)

    // Act & Assert
    await expect(
      branchService.createBranch({
        name: 'Filial Teste',
        churchId: 'church-inexistente',
      })
    ).rejects.toThrow('Igreja não encontrada')

    expect(prisma.branch.create).not.toHaveBeenCalled()
  })

  // Teste 3: Forbidden - Não é ADMINGERAL
  it('deve lançar erro se criador não for ADMINGERAL', async () => {
    // Arrange
    ;(prisma.church.findUnique as any).mockResolvedValue({
      id: mockChurchId,
      name: 'Igreja Teste',
    })
    ;(getMemberFromUserId as any).mockResolvedValue({
      id: 'member-1',
      role: 'COORDINATOR',
      Branch: {
        churchId: mockChurchId,
      },
    })

    // Act & Assert
    await expect(
      branchService.createBranch({
        name: 'Filial Teste',
        churchId: mockChurchId,
        creatorUserId: mockCreatorUserId,
      })
    ).rejects.toThrow('Apenas Administradores Gerais podem criar filiais')

    expect(prisma.branch.create).not.toHaveBeenCalled()
  })

  // Teste 4: Forbidden - Criador não tem Branch associada
  it('deve lançar erro se criador não tem Branch associada', async () => {
    // Arrange
    ;(prisma.church.findUnique as any).mockResolvedValue({
      id: mockChurchId,
      name: 'Igreja Teste',
    })
    ;(getMemberFromUserId as any).mockResolvedValue({
      id: 'member-1',
      role: 'ADMINGERAL',
      Branch: null,
    })

    // Act & Assert
    await expect(
      branchService.createBranch({
        name: 'Filial Teste',
        churchId: mockChurchId,
        creatorUserId: mockCreatorUserId,
      })
    ).rejects.toThrow('Membro criador não está associado a uma filial')

    expect(prisma.branch.create).not.toHaveBeenCalled()
  })

  // Teste 5: Forbidden - Igreja não pertence ao criador
  it('deve lançar erro se igreja não pertence ao criador', async () => {
    // Arrange
    ;(prisma.church.findUnique as any).mockResolvedValue({
      id: mockChurchId,
      name: 'Igreja Teste',
    })
    ;(getMemberFromUserId as any).mockResolvedValue({
      id: 'member-1',
      role: 'ADMINGERAL',
      Branch: {
        churchId: 'church-outra',
      },
    })

    // Act & Assert
    await expect(
      branchService.createBranch({
        name: 'Filial Teste',
        churchId: mockChurchId,
        creatorUserId: mockCreatorUserId,
      })
    ).rejects.toThrow('Você não pode criar filiais para outras igrejas')

    expect(prisma.branch.create).not.toHaveBeenCalled()
  })

  // Teste 6: Dependency failure propagation - Erro do checkPlanBranchesLimit
  it('deve propagar erro se checkPlanBranchesLimit falhar', async () => {
    // Arrange
    const limitError = new Error('Limite do plano atingido')
    ;(prisma.church.findUnique as any).mockResolvedValue({
      id: mockChurchId,
      name: 'Igreja Teste',
    })
    ;(getMemberFromUserId as any).mockResolvedValue({
      id: 'member-1',
      role: 'ADMINGERAL',
      Branch: {
        churchId: mockChurchId,
      },
    })
    ;(checkPlanBranchesLimit as any).mockRejectedValue(limitError)

    // Act & Assert
    await expect(
      branchService.createBranch({
        name: 'Filial Teste',
        churchId: mockChurchId,
        creatorUserId: mockCreatorUserId,
      })
    ).rejects.toThrow(limitError)

    expect(checkPlanBranchesLimit).toHaveBeenCalledWith(mockCreatorUserId)
    expect(prisma.branch.create).not.toHaveBeenCalled()
  })

  // Testes adicionais para outros métodos

  describe('getAllBranches', () => {
    it('deve retornar todas as branches', async () => {
      // Arrange
      const mockBranches = [
        { id: 'branch-1', name: 'Filial 1' },
        { id: 'branch-2', name: 'Filial 2' },
      ]
      ;(prisma.branch.findMany as any).mockResolvedValue(mockBranches)

      // Act
      const result = await branchService.getAllBranches()

      // Assert
      expect(result).toEqual(mockBranches)
      expect(prisma.branch.findMany).toHaveBeenCalled()
    })
  })

  describe('getBranchById', () => {
    it('deve retornar branch por id', async () => {
      // Arrange
      const mockBranch = { id: mockBranchId, name: 'Filial Teste' }
      ;(prisma.branch.findUnique as any).mockResolvedValue(mockBranch)

      // Act
      const result = await branchService.getBranchById(mockBranchId)

      // Assert
      expect(result).toEqual(mockBranch)
      expect(prisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: mockBranchId },
      })
    })
  })

  describe('deleteBranchById', () => {
    it('deve deletar branch por id', async () => {
      // Arrange
      const mockBranch = { id: mockBranchId, name: 'Filial Teste' }
      ;(prisma.branch.delete as any).mockResolvedValue(mockBranch)

      // Act
      const result = await branchService.deleteBranchById(mockBranchId)

      // Assert
      expect(result).toEqual(mockBranch)
      expect(prisma.branch.delete).toHaveBeenCalledWith({
        where: { id: mockBranchId },
      })
    })
  })
})
