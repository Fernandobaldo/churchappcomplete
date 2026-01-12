// Unit tests para AdminAuditService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminAuditService } from '../../../src/services/adminAuditService'
import { prisma } from '../../../src/lib/prisma'
import { AdminRole } from '@prisma/client'

// Mock do Prisma - OBRIGATÓRIO em unit tests
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    adminUser: {
      findUnique: vi.fn(),
    },
  },
}))

describe('AdminAuditService - Unit Tests', () => {
  let service: AdminAuditService
  const mockAdminUserId = 'admin-test-123' // ID mock - não usar banco real
  const mockAdminUser = {
    id: mockAdminUserId,
    name: 'Test Admin',
    email: 'testadmin@test.com',
    adminRole: AdminRole.SUPERADMIN,
    isActive: true,
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  }

  beforeEach(() => {
    service = new AdminAuditService()
    vi.clearAllMocks()
  })

  describe('getAdminAuditLogs', () => {
    // Teste 1: Success - Buscar logs com filtro de ação
    it('deve retornar logs filtrados por ação', async () => {
      // Arrange
      const mockLogs = [
        {
          id: 'log-1',
          action: 'PLAN_CHANGED',
          entityType: 'Church',
          entityId: 'church-1',
          userId: mockAdminUserId,
          userEmail: 'testadmin@test.com',
          description: 'Plano alterado',
          metadata: { churchId: 'church-1', newPlanId: 'plan-1' },
          createdAt: new Date(),
          AdminUser: {
            id: mockAdminUserId,
            name: 'Test Admin',
            email: 'testadmin@test.com',
            adminRole: AdminRole.SUPERADMIN,
          },
        },
      ]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1)

      // Act
      const result = await service.getAdminAuditLogs(
        { action: 'PLAN_CHANGED' },
        { page: 1, limit: 10 }
      )

      // Assert
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0].action).toBe('PLAN_CHANGED')
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(1)
      expect(prisma.auditLog.findMany).toHaveBeenCalled()
      expect(prisma.auditLog.count).toHaveBeenCalled()
    })

    // Teste 2: Success - Buscar logs com filtro de data
    it('deve filtrar corretamente logs por intervalo de data', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      const mockLogs = [
        {
          id: 'log-1',
          action: 'ADMIN_LOGIN',
          entityType: 'System',
          userId: mockAdminUserId,
          userEmail: 'testadmin@test.com',
          description: 'Admin fez login',
          createdAt: new Date('2024-06-15'),
          AdminUser: {
            id: mockAdminUserId,
            name: 'Test Admin',
            email: 'testadmin@test.com',
            adminRole: AdminRole.SUPERADMIN,
          },
        },
      ]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1)

      // Act
      const result = await service.getAdminAuditLogs(
        { startDate, endDate },
        { page: 1, limit: 10 }
      )

      // Assert
      expect(result.logs.length).toBeGreaterThan(0)
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      )
    })

    // Teste 3: Success - Paginação
    it('deve paginar corretamente os logs', async () => {
      // Arrange
      const mockLogs = [
        {
          id: 'log-1',
          action: 'ADMIN_LOGIN',
          entityType: 'System',
          userId: mockAdminUserId,
          userEmail: 'testadmin@test.com',
          description: 'Login 1',
          createdAt: new Date(),
          AdminUser: {
            id: mockAdminUserId,
            name: 'Test Admin',
            email: 'testadmin@test.com',
            adminRole: AdminRole.SUPERADMIN,
          },
        },
        {
          id: 'log-2',
          action: 'ADMIN_LOGIN',
          entityType: 'System',
          userId: mockAdminUserId,
          userEmail: 'testadmin@test.com',
          description: 'Login 2',
          createdAt: new Date(),
          AdminUser: {
            id: mockAdminUserId,
            name: 'Test Admin',
            email: 'testadmin@test.com',
            adminRole: AdminRole.SUPERADMIN,
          },
        },
        {
          id: 'log-3',
          action: 'ADMIN_LOGIN',
          entityType: 'System',
          userId: mockAdminUserId,
          userEmail: 'testadmin@test.com',
          description: 'Login 3',
          createdAt: new Date(),
          AdminUser: {
            id: mockAdminUserId,
            name: 'Test Admin',
            email: 'testadmin@test.com',
            adminRole: AdminRole.SUPERADMIN,
          },
        },
      ]

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any)
      vi.mocked(prisma.auditLog.count).mockResolvedValue(30) // Total de 30 logs

      // Act: Buscar primeira página
      const page1 = await service.getAdminAuditLogs({}, { page: 1, limit: 10 })

      // Assert
      expect(page1.logs.length).toBe(3) // Mock retorna 3, mas com skip/take funcionaria
      expect(page1.pagination.page).toBe(1)
      expect(page1.pagination.limit).toBe(10)
      expect(page1.pagination.total).toBe(30)
      expect(page1.pagination.totalPages).toBe(3)
    })
  })

  describe('logAdminAction', () => {
    // Teste 4: Success - Criar log de ação admin
    it('deve criar log de ação admin com sucesso', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'log-1',
        action: 'ADMIN_LOGIN',
        entityType: 'System',
        entityId: null,
        userId: mockAdminUserId,
        userEmail: 'testadmin@test.com',
        userRole: AdminRole.SUPERADMIN,
        description: 'Admin fez login',
        metadata: {},
        adminUserId: mockAdminUserId,
        createdAt: new Date(),
      }

      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      const result = await service.logAdminAction('ADMIN_LOGIN', {}, mockAdminUserId)

      // Assert
      expect(result).toEqual(mockAuditLog)
      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: mockAdminUserId },
      })
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ADMIN_LOGIN',
            userId: mockAdminUserId,
            userEmail: mockAdminUser.email,
          }),
        })
      )
    })

    // Teste 5: Validation failure - Admin não existe
    it('deve lançar erro quando admin não existe ao criar log', async () => {
      // Arrange
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.logAdminAction('ADMIN_LOGIN', {}, 'inexistente-admin-id')
      ).rejects.toThrow('Admin não encontrado')

      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'inexistente-admin-id' },
      })
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    // Teste 6: Edge case - Metadata e entityId opcionais
    it('deve criar log com metadata e entityId quando fornecidos', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'log-1',
        action: 'PLAN_CHANGED',
        entityType: 'Church',
        entityId: 'church-1',
        userId: mockAdminUserId,
        userEmail: 'testadmin@test.com',
        userRole: AdminRole.SUPERADMIN,
        description: 'Plano alterado',
        metadata: { churchId: 'church-1', newPlanId: 'plan-1' },
        adminUserId: mockAdminUserId,
        createdAt: new Date(),
      }

      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any)

      // Act
      const result = await service.logAdminAction(
        'PLAN_CHANGED',
        {
          entityType: 'Church',
          entityId: 'church-1',
          description: 'Plano alterado',
        },
        mockAdminUserId
      )

      // Assert
      expect(result).toEqual(mockAuditLog)
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PLAN_CHANGED',
            entityType: 'Church',
            entityId: 'church-1',
            description: 'Plano alterado',
            metadata: {
              entityType: 'Church',
              entityId: 'church-1',
              description: 'Plano alterado',
            },
          }),
        })
      )
    })
  })
})
