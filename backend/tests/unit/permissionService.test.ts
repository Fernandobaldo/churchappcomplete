// Unit tests para PermissionService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as permissionService from '../../src/services/auth/permissionsService'
import { prisma } from '../../src/lib/prisma'

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    permission: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

describe('PermissionService - Unit Tests', () => {
  const mockMemberId = 'member-test-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Teste 1: Success - Listar todas as permissões
  it('deve listar todas as permissões disponíveis', async () => {
    // Arrange
    const mockPermissions = [
      { type: 'members_manage' },
      { type: 'events_manage' },
      { type: 'finances_view' },
    ]
    ;(prisma.permission.findMany as any).mockResolvedValue(mockPermissions)

    // Act
    const result = await permissionService.getAllPermissionsService()

    // Assert
    expect(result).toEqual(mockPermissions)
    expect(prisma.permission.findMany).toHaveBeenCalledWith({
      select: { type: true },
      distinct: ['type'],
    })
  })

  // Teste 2: Success - Atribuir permissões
  it('deve atribuir permissões a um membro com sucesso', async () => {
    // Arrange
    const permissions = ['members_manage', 'events_manage']
    const mockResult = { count: 2 }
    ;(prisma.permission.createMany as any).mockResolvedValue(mockResult)

    // Act
    const result = await permissionService.assignPermissionsService(
      mockMemberId,
      permissions
    )

    // Assert
    expect(result).toEqual({
      success: true,
      added: 2,
    })
    expect(prisma.permission.createMany).toHaveBeenCalledWith({
      data: permissions.map((type) => ({ memberId: mockMemberId, type })),
      skipDuplicates: true,
    })
  })

  // Teste 3: Validation failure - Array vazio de permissões
  it('deve processar array vazio de permissões corretamente', async () => {
    // Arrange
    ;(prisma.permission.createMany as any).mockResolvedValue({ count: 0 })

    // Act
    const result = await permissionService.assignPermissionsService(
      mockMemberId,
      []
    )

    // Assert
    expect(result).toEqual({
      success: true,
      added: 0,
    })
    expect(prisma.permission.createMany).toHaveBeenCalledWith({
      data: [],
      skipDuplicates: true,
    })
  })

  // Teste 4: Edge case #1 - Permissões duplicadas (skipDuplicates)
  it('deve ignorar permissões duplicadas ao atribuir', async () => {
    // Arrange
    const permissions = ['members_manage', 'members_manage', 'events_manage']
    ;(prisma.permission.createMany as any).mockResolvedValue({ count: 2 }) // Apenas 2 únicas

    // Act
    const result = await permissionService.assignPermissionsService(
      mockMemberId,
      permissions
    )

    // Assert
    expect(result.added).toBe(2)
    expect(prisma.permission.createMany).toHaveBeenCalledWith({
      data: permissions.map((type) => ({ memberId: mockMemberId, type })),
      skipDuplicates: true,
    })
  })

  // Teste 5: Edge case #2 - memberId inválido (null/undefined)
  it('deve processar mesmo com memberId inválido (validação no controller)', async () => {
    // Arrange
    // O service não valida memberId - validação é no controller
    ;(prisma.permission.createMany as any).mockResolvedValue({ count: 0 })

    // Act
    // Passando memberId vazio como string (validação no controller)
    const result = await permissionService.assignPermissionsService(
      '' as any,
      ['members_manage']
    )

    // Assert
    // Service não valida, apenas processa
    expect(result).toBeDefined()
    expect(prisma.permission.createMany).toHaveBeenCalled()
  })

  // Teste 6: Dependency failure propagation - Erro do Prisma
  it('deve propagar erro se Prisma falhar ao atribuir permissões', async () => {
    // Arrange
    const dbError = new Error('Database connection failed')
    ;(prisma.permission.createMany as any).mockRejectedValue(dbError)

    // Act & Assert
    await expect(
      permissionService.assignPermissionsService(mockMemberId, [
        'members_manage',
      ])
    ).rejects.toThrow(dbError)

    // Assert
    expect(prisma.permission.createMany).toHaveBeenCalled()
  })
})
