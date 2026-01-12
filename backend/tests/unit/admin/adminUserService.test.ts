// Unit tests para AdminUserService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminUserService } from '../../../src/services/adminUserService'
import { prisma } from '../../../src/lib/prisma'
import { AdminRole, SubscriptionStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

// Mock do Prisma - OBRIGATÓRIO em unit tests
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

// Mock do jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
  },
}))

// Mock do crypto
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'mock-reset-token'),
  })),
}))

describe('AdminUserService - Unit Tests', () => {
  let service: AdminUserService
  const mockAdminUserId = 'admin-test-123'
  const mockUserId = 'user-test-123'
  const mockMemberId = 'member-test-123'
  const mockPlanId = 'plan-test-123'
  const mockSubscriptionId = 'subscription-test-123'
  const mockBranchId = 'branch-test-123'
  const mockChurchId = 'church-test-123'

  const mockUser = {
    id: mockUserId,
    email: 'testuser@test.com',
    firstName: 'Test',
    lastName: 'User',
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    Subscription: [
      {
        id: mockSubscriptionId,
        planId: mockPlanId,
        status: SubscriptionStatus.active,
        startedAt: new Date(),
        endsAt: null,
        Plan: {
          id: mockPlanId,
          name: 'Test Plan',
          price: 0,
        },
      },
    ],
    Member: {
      id: mockMemberId,
      role: 'ADMINGERAL',
      branchId: mockBranchId,
      Branch: {
        id: mockBranchId,
        name: 'Main Branch',
        churchId: mockChurchId,
        Church: {
          id: mockChurchId,
          name: 'Test Church',
        },
      },
      Permission: [
        {
          id: 'perm-1',
          type: 'church_manage',
        },
      ],
    },
  }

  beforeEach(() => {
    service = new AdminUserService()
    vi.clearAllMocks()
    // Mock JWT_SECRET para evitar erro de env
    process.env.JWT_SECRET = 'test-secret-key'
  })

  describe('getAllUsers', () => {
    // Teste 1: Success - Listar usuários com filtro
    it('deve retornar lista de usuários filtrados por status', async () => {
      // Arrange
      const blockedUser = {
        ...mockUser,
        id: 'blocked-user-123',
        email: 'blocked@test.com',
        isBlocked: true,
      }

      vi.mocked(prisma.user.findMany).mockResolvedValue([blockedUser] as any)
      vi.mocked(prisma.user.count).mockResolvedValue(1)

      // Act
      const result = await service.getAllUsers(
        { status: 'blocked' },
        { page: 1, limit: 10 }
      )

      // Assert
      expect(result.users).toHaveLength(1)
      expect(result.users[0].isBlocked).toBe(true)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
      expect(prisma.user.findMany).toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    // Teste 2: Success - Buscar usuário por ID
    it('deve retornar detalhes completos do usuário', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Act
      const result = await service.getUserById(mockUserId)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(mockUserId)
      expect(result?.email).toBe('testuser@test.com')
      expect(result?.churchesAsOwner).toBeDefined()
      expect(result?.subscription).toBeDefined()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: expect.any(Object),
      })
    })

    // Teste 3: Edge case - Usuário não encontrado
    it('deve retornar null quando usuário não existe', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      // Act
      const result = await service.getUserById('inexistente-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('blockUser', () => {
    // Teste 4: Success - Bloquear usuário
    it('deve bloquear usuário e registrar no audit log', async () => {
      // Arrange
      const blockedUser = { ...mockUser, isBlocked: true }
      const mockAuditLog = {
        id: 'audit-log-1',
        action: 'USER_BLOCKED',
        entityType: 'User',
        entityId: mockUserId,
      }

      vi.mocked(prisma.user.update).mockResolvedValue(blockedUser as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      await service.blockUser(mockUserId, mockAdminUserId)

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { isBlocked: true },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_BLOCKED',
            entityType: 'User',
            entityId: mockUserId,
          }),
        })
      )
    })
  })

  describe('unblockUser', () => {
    // Teste 5: Success - Desbloquear usuário
    it('deve desbloquear usuário e registrar no audit log', async () => {
      // Arrange
      const unblockedUser = { ...mockUser, isBlocked: false }
      const mockAuditLog = {
        id: 'audit-log-2',
        action: 'USER_UNBLOCKED',
        entityType: 'User',
        entityId: mockUserId,
      }

      vi.mocked(prisma.user.update).mockResolvedValue(unblockedUser as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      await service.unblockUser(mockUserId, mockAdminUserId)

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { isBlocked: false },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_UNBLOCKED',
            entityType: 'User',
            entityId: mockUserId,
          }),
        })
      )
    })
  })

  describe('sendPasswordReset', () => {
    // Teste 6: Success - Enviar reset de senha
    it('deve gerar token de reset e registrar no audit log', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'audit-log-3',
        action: 'PASSWORD_RESET_SENT',
        entityType: 'User',
        entityId: mockUserId,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      const result = await service.sendPasswordReset(mockUserId, mockAdminUserId)

      // Assert
      expect(result.message).toContain('reset de senha')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PASSWORD_RESET_SENT',
            entityType: 'User',
            entityId: mockUserId,
            userEmail: mockUser.email,
          }),
        })
      )
      expect(randomBytes).toHaveBeenCalledWith(32)
    })

    // Teste 7: Validation failure - Usuário não encontrado
    it('deve lançar erro quando usuário não existe ao enviar reset', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.sendPasswordReset('inexistente-id', mockAdminUserId)
      ).rejects.toThrow('Usuário não encontrado')

      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })
  })

  describe('impersonateUser', () => {
    // Teste 8: Success - Impersonar usuário (SUPERADMIN)
    it('deve gerar token de impersonação com permissão SUPERADMIN', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'audit-log-4',
        action: 'IMPERSONATE_USER',
        entityType: 'User',
        entityId: mockUserId,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      const result = await service.impersonateUser(mockUserId, mockAdminUserId, AdminRole.SUPERADMIN)

      // Assert
      expect(result.token).toBe('mock-jwt-token')
      expect(result.expiresIn).toBe('30m')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: expect.any(Object),
      })
      expect(prisma.auditLog.create).toHaveBeenCalled()
      expect(jwt.sign).toHaveBeenCalled()
    })

    // Teste 9: Validation failure - Sem permissão para impersonar
    it('deve lançar erro quando admin não tem permissão para impersonar', async () => {
      // Act & Assert
      await expect(
        service.impersonateUser(mockUserId, mockAdminUserId, AdminRole.FINANCE)
      ).rejects.toThrow('Sem permissão para impersonar usuário')

      expect(prisma.user.findUnique).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    // Teste 10: Validation failure - Usuário não encontrado
    it('deve lançar erro quando usuário não existe ao impersonar', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.impersonateUser('inexistente-id', mockAdminUserId, AdminRole.SUPERADMIN)
      ).rejects.toThrow('Usuário não encontrado')

      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })
  })
})
