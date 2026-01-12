// Unit tests para AdminChurchService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminChurchService } from '../../../src/services/adminChurchService'
import { prisma } from '../../../src/lib/prisma'
import { AdminRole, SubscriptionStatus } from '@prisma/client'

// Mock do Prisma - OBRIGATÓRIO em unit tests
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
    church: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    branch: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock do AdminUserService (usado em impersonateChurchOwner)
vi.mock('../../../src/services/adminUserService', () => ({
  AdminUserService: vi.fn().mockImplementation(() => ({
    impersonateUser: vi.fn().mockResolvedValue({ token: 'mock-impersonate-token' }),
  })),
}))

describe('AdminChurchService - Unit Tests', () => {
  let service: AdminChurchService
  const mockAdminUserId = 'admin-test-123'
  const mockChurchId = 'church-test-123'
  const mockBranchId = 'branch-test-123'
  const mockUserId = 'user-test-123'
  const mockMemberId = 'member-test-123'
  const mockPlanId = 'plan-test-123'
  const mockSubscriptionId = 'subscription-test-123'

  const mockChurch = {
    id: mockChurchId,
    name: 'Test Church',
    isActive: true,
    address: null,
    phone: null,
    email: null,
    website: null,
    logoUrl: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    Branch: [
      {
        id: mockBranchId,
        name: 'Main Branch',
        churchId: mockChurchId,
        isMainBranch: true,
        Member: [],
      },
    ],
  }

  const mockOwner = {
    id: mockMemberId,
    name: 'Church Owner',
    email: 'owner@test.com',
    role: 'ADMINGERAL',
    branchId: mockBranchId,
    userId: mockUserId,
    User: {
      id: mockUserId,
      email: 'owner@test.com',
      firstName: 'Church',
      lastName: 'Owner',
      Subscription: [
        {
          id: mockSubscriptionId,
          planId: mockPlanId,
          status: SubscriptionStatus.active,
          Plan: {
            id: mockPlanId,
            name: 'Test Plan',
            price: 0,
          },
        },
      ],
    },
  }

  beforeEach(() => {
    service = new AdminChurchService()
    vi.clearAllMocks()
  })

  describe('suspendChurch', () => {
    // Teste 1: Success - Suspender igreja
    it('deve suspender igreja e registrar no audit log', async () => {
      // Arrange
      const suspendedChurch = { ...mockChurch, isActive: false }
      const mockAuditLog = {
        id: 'audit-log-1',
        action: 'CHURCH_SUSPENDED',
        entityType: 'Church',
        entityId: mockChurchId,
      }

      vi.mocked(prisma.church.update).mockResolvedValue(suspendedChurch as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      await service.suspendChurch(mockChurchId, mockAdminUserId)

      // Assert
      expect(prisma.church.update).toHaveBeenCalledWith({
        where: { id: mockChurchId },
        data: { isActive: false },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CHURCH_SUSPENDED',
            entityType: 'Church',
            entityId: mockChurchId,
          }),
        })
      )
    })
  })

  describe('reactivateChurch', () => {
    // Teste 2: Success - Reativar igreja
    it('deve reativar igreja e registrar no audit log', async () => {
      // Arrange
      const reactivatedChurch = { ...mockChurch, isActive: true }
      const mockAuditLog = {
        id: 'audit-log-2',
        action: 'CHURCH_REACTIVATED',
        entityType: 'Church',
        entityId: mockChurchId,
      }

      vi.mocked(prisma.church.update).mockResolvedValue(reactivatedChurch as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      await service.reactivateChurch(mockChurchId, mockAdminUserId)

      // Assert
      expect(prisma.church.update).toHaveBeenCalledWith({
        where: { id: mockChurchId },
        data: { isActive: true },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CHURCH_REACTIVATED',
            entityType: 'Church',
            entityId: mockChurchId,
          }),
        })
      )
    })
  })

  describe('changeChurchPlan', () => {
    // Teste 3: Success - Trocar plano da igreja
    it('deve trocar plano da igreja com sucesso', async () => {
      // Arrange
      const newPlanId = 'new-plan-123'
      const churchWithBranch = {
        ...mockChurch,
        Branch: [{ id: mockBranchId, churchId: mockChurchId }],
      }
      const currentSubscription = {
        id: mockSubscriptionId,
        userId: mockUserId,
        planId: mockPlanId,
        status: SubscriptionStatus.active,
        Plan: { id: mockPlanId, name: 'Old Plan' },
      }
      const updatedSubscription = {
        ...currentSubscription,
        planId: newPlanId,
      }
      const mockAuditLog = {
        id: 'audit-log-3',
        action: 'PLAN_CHANGED',
        entityType: 'Church',
        entityId: mockChurchId,
      }

      vi.mocked(prisma.church.findUnique).mockResolvedValue(churchWithBranch as any)
      vi.mocked(prisma.member.findFirst).mockResolvedValue(mockOwner as any)
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(currentSubscription as any)
      vi.mocked(prisma.subscription.update).mockResolvedValue(updatedSubscription as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      await service.changeChurchPlan(mockChurchId, newPlanId, mockAdminUserId)

      // Assert
      expect(prisma.church.findUnique).toHaveBeenCalledWith({
        where: { id: mockChurchId },
        include: { Branch: { take: 1 } },
      })
      expect(prisma.member.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            branchId: mockBranchId,
            role: 'ADMINGERAL',
          },
        })
      )
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: mockSubscriptionId },
        data: { planId: newPlanId },
      })
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })

    // Teste 4: Validation failure - Igreja não existe
    it('deve lançar erro quando igreja não existe ao trocar plano', async () => {
      // Arrange
      vi.mocked(prisma.church.findUnique).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.changeChurchPlan('inexistente-church-id', mockPlanId, mockAdminUserId)
      ).rejects.toThrow('Igreja não encontrada')

      expect(prisma.member.findFirst).not.toHaveBeenCalled()
      expect(prisma.subscription.update).not.toHaveBeenCalled()
    })

    // Teste 5: Validation failure - Dono não encontrado
    it('deve lançar erro quando dono da igreja não é encontrado ao trocar plano', async () => {
      // Arrange
      const churchWithBranch = {
        ...mockChurch,
        Branch: [{ id: mockBranchId, churchId: mockChurchId }],
      }

      vi.mocked(prisma.church.findUnique).mockResolvedValue(churchWithBranch as any)
      vi.mocked(prisma.member.findFirst).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.changeChurchPlan(mockChurchId, mockPlanId, mockAdminUserId)
      ).rejects.toThrow('Dono da igreja não encontrado')

      expect(prisma.subscription.update).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    // Teste 6: Edge case - Criar subscription se não existe
    it('deve criar subscription se não existe ao trocar plano', async () => {
      // Arrange
      const newPlanId = 'new-plan-456'
      const churchWithBranch = {
        ...mockChurch,
        Branch: [{ id: mockBranchId, churchId: mockChurchId }],
      }
      const newSubscription = {
        id: 'new-subscription-123',
        userId: mockUserId,
        planId: newPlanId,
        status: SubscriptionStatus.active,
      }
      const mockAuditLog = {
        id: 'audit-log-4',
        action: 'PLAN_CHANGED',
      }

      vi.mocked(prisma.church.findUnique).mockResolvedValue(churchWithBranch as any)
      vi.mocked(prisma.member.findFirst).mockResolvedValue(mockOwner as any)
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null) // Sem subscription atual
      vi.mocked(prisma.subscription.create).mockResolvedValue(newSubscription as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      await service.changeChurchPlan(mockChurchId, newPlanId, mockAdminUserId)

      // Assert
      expect(prisma.subscription.findFirst).toHaveBeenCalled()
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          planId: newPlanId,
          status: SubscriptionStatus.active,
        },
      })
      expect(prisma.subscription.update).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })
})
