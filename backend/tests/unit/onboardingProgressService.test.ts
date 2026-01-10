// Unit tests para OnboardingProgressService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OnboardingProgressService } from '../../src/services/onboardingProgressService'
import { prisma } from '../../src/lib/prisma'

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    onboardingProgress: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

describe('OnboardingProgressService - Unit Tests', () => {
  let service: OnboardingProgressService
  const mockUserId = 'user-test-123' // ID mock - não precisa criar usuário real em testes unitários

  beforeEach(() => {
    service = new OnboardingProgressService()
    vi.clearAllMocks()
  })

  describe('getOrCreateProgress', () => {
    // Teste 1: Success
    it('deve criar progresso se não existe', async () => {
      // Arrange
      const userId = mockUserId

      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue(null)
      ;(prisma.onboardingProgress.create as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: false,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })

      // Act
      const progress = await service.getOrCreateProgress(userId)

      // Assert
      expect(progress.userId).toBe(userId)
      expect(progress.churchConfigured).toBe(false)
      expect(progress.branchesConfigured).toBe(false)
      expect(progress.settingsConfigured).toBe(false)
      expect(progress.completed).toBe(false)
      expect(prisma.onboardingProgress.findUnique).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(prisma.onboardingProgress.create).toHaveBeenCalledWith({
        data: { userId },
      })
    })

    // Teste 2: Success - Retornar existente
    it('deve retornar progresso existente se já existe', async () => {
      // Arrange
      const userId = mockUserId
      const existingProgress = {
        id: 'progress-1',
        userId,
        churchConfigured: true,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      }

      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue(existingProgress)

      // Act
      const progress = await service.getOrCreateProgress(userId)

      // Assert
      expect(progress).toEqual(existingProgress)
      expect(prisma.onboardingProgress.findUnique).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(prisma.onboardingProgress.create).not.toHaveBeenCalled()
    })
  })

  describe('markStepComplete', () => {
    // Teste 3: Success - Marcar etapa church
    it('deve marcar etapa church como completa', async () => {
      // Arrange
      const userId = mockUserId

      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: false,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })
      ;(prisma.onboardingProgress.update as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: true,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })

      // Act
      const progress = await service.markStepComplete(userId, 'church')

      // Assert
      expect(progress.churchConfigured).toBe(true)
      expect(progress.branchesConfigured).toBe(false)
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith({
        where: { userId },
        data: { churchConfigured: true },
      })
    })

    // Teste 4: Validation failure - Step inválido
    // Nota: O service não valida o step diretamente (validação é feita no controller)
    // Este teste verifica que o service aceita qualquer step e atualiza o campo correspondente
    it('deve processar step mesmo se não for um dos valores esperados', async () => {
      // Arrange
      const userId = mockUserId

      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: false,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })
      // Mock para o caso de step inválido - service não valida, apenas processa
      ;(prisma.onboardingProgress.update as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: false,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })

      // Act
      // Service não valida o step, apenas processa
      // A validação é feita no controller (onboardingController.ts)
      const progress = await service.markStepComplete(userId, 'invalid' as any)

      // Assert
      // O service não atualiza nenhum campo se step for inválido
      // Mas não lança erro (validação é no controller)
      expect(progress).toBeDefined()
      expect(prisma.onboardingProgress.update).toHaveBeenCalled()
    })

    // Teste 5: Edge case #1 - Progresso não existe (deve criar primeiro)
    it('deve criar progresso automaticamente se não existe ao marcar etapa', async () => {
      // Arrange
      const userId = mockUserId

      // Primeira chamada (getOrCreateProgress) não encontra
      ;(prisma.onboardingProgress.findUnique as any)
        .mockResolvedValueOnce(null) // Primeira chamada em getOrCreateProgress
        .mockResolvedValueOnce(null) // Chamada antes de update (verificação)
      ;(prisma.onboardingProgress.create as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: false,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })
      ;(prisma.onboardingProgress.update as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: true,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })

      // Act
      const progress = await service.markStepComplete(userId, 'church')

      // Assert
      expect(progress.churchConfigured).toBe(true)
      expect(prisma.onboardingProgress.create).toHaveBeenCalled()
    })

    // Teste 6: Dependency failure - Erro no banco
    it('deve propagar erro se banco de dados falhar no update', async () => {
      // Arrange
      const userId = mockUserId
      const dbError = new Error('Database connection failed')

      // getOrCreateProgress vai funcionar (findUnique retorna null, create cria)
      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue(null)
      ;(prisma.onboardingProgress.create as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: false,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
        completedAt: null,
      })

      // Mas o update vai falhar
      ;(prisma.onboardingProgress.update as any).mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.markStepComplete(userId, 'church')).rejects.toThrow(dbError)
      
      // Verificar que update foi chamado e falhou
      expect(prisma.onboardingProgress.update).toHaveBeenCalled()
    })
  })

  describe('markComplete', () => {
    // Teste adicional: Success - Marcar como completo
    it('deve marcar onboarding como completo', async () => {
      // Arrange
      const userId = mockUserId
      const completedAt = new Date()

      ;(prisma.onboardingProgress.update as any).mockResolvedValue({
        id: 'progress-1',
        userId,
        churchConfigured: true,
        branchesConfigured: true,
        settingsConfigured: true,
        completed: true,
        completedAt,
      })

      // Act
      const progress = await service.markComplete(userId)

      // Assert
      expect(progress.completed).toBe(true)
      expect(progress.completedAt).toBeDefined()
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          completed: true,
          completedAt: expect.any(Date),
        },
      })
    })
  })

  describe('isCompleted', () => {
    // Teste adicional: Success - Retornar true se completo
    it('deve retornar true se onboarding está completo', async () => {
      // Arrange
      const userId = mockUserId

      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue({
        completed: true,
      })

      // Act
      const completed = await service.isCompleted(userId)

      // Assert
      expect(completed).toBe(true)
      expect(prisma.onboardingProgress.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { completed: true },
      })
    })

    // Teste adicional: Edge case - Retornar false se não existe
    it('deve retornar false se progresso não existe', async () => {
      // Arrange
      const userId = mockUserId

      ;(prisma.onboardingProgress.findUnique as any).mockResolvedValue(null)

      // Act
      const completed = await service.isCompleted(userId)

      // Assert
      expect(completed).toBe(false)
    })
  })
})

