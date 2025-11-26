import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChurchService } from '../../src/services/churchService'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password, rounds) => Promise.resolve(`hashed_${password}`)),
  },
}))

vi.mock('../../src/lib/prisma', () => {
  const mock = {
    church: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    branch: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    member: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(), // Adicionado para verificar por userId ou email
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(mock)),
  }

  return { prisma: mock }
})

const service = new ChurchService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChurchService - Onboarding', () => {
  const mockUserData = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed_password',
  }

  const mockFreePlan = {
    id: 'plan-free',
    name: 'free',
    maxMembers: 10,
    maxBranches: 1,
  }

  it('deve criar igreja com filial principal e membro administrador', async () => {
    const mockChurch = {
      id: 'church-123',
      name: 'Igreja Teste',
      isActive: true,
    }

    const mockBranch = {
      id: 'branch-123',
      name: 'Sede',
      churchId: 'church-123',
      isMainBranch: true,
    }

    const mockMember = {
      id: 'member-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMINGERAL',
      branchId: 'branch-123',
    }

    vi.mocked(prisma.church.create).mockResolvedValue(mockChurch as any)
    vi.mocked(prisma.branch.create).mockResolvedValue(mockBranch as any)
    vi.mocked(prisma.member.findFirst).mockResolvedValue(null) // Não existe, então cria novo
    vi.mocked(prisma.member.create).mockResolvedValue(mockMember as any)
    vi.mocked(prisma.member.update).mockResolvedValue(mockMember as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserData as any)
    vi.mocked(prisma.permission.findMany).mockResolvedValue([])
    vi.mocked(prisma.permission.createMany).mockResolvedValue({ count: 0 })

    const result = await service.createChurchWithMainBranch(
      {
        name: 'Igreja Teste',
        withBranch: true,
        branchName: 'Sede',
      },
      mockUserData
    )

    expect(result.church).toEqual(mockChurch)
    expect(result.branch).toEqual(mockBranch)
    expect(result.member).toBeDefined()
    expect(result.member.role).toBe('ADMINGERAL')
  })

  it('deve criar igreja sem filial se withBranch for false', async () => {
    const mockChurch = {
      id: 'church-123',
      name: 'Igreja Sem Filial',
      isActive: true,
    }

    vi.mocked(prisma.church.create).mockResolvedValue(mockChurch as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserData as any)

    const result = await service.createChurchWithMainBranch(
      {
        name: 'Igreja Sem Filial',
        withBranch: false,
      },
      mockUserData
    )

    expect(result.church).toEqual(mockChurch)
    expect(prisma.branch.create).not.toHaveBeenCalled()
  })

  it('deve associar permissões ao membro administrador', async () => {
    const mockPermissions = [
      { id: 'perm-1', type: 'events_manage' },
      { id: 'perm-2', type: 'members_manage' },
    ]

    vi.mocked(prisma.church.create).mockResolvedValue({
      id: 'church-123',
      name: 'Igreja Teste',
    } as any)
    vi.mocked(prisma.branch.create).mockResolvedValue({
      id: 'branch-123',
      name: 'Sede',
    } as any)
    vi.mocked(prisma.member.findFirst).mockResolvedValue(null) // Não existe, então cria novo
    vi.mocked(prisma.member.create).mockResolvedValue({
      id: 'member-123',
      role: 'ADMINGERAL',
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserData as any)
    vi.mocked(prisma.permission.findMany).mockResolvedValue(mockPermissions as any)
    vi.mocked(prisma.permission.createMany).mockResolvedValue({ count: 2 })

    await service.createChurchWithMainBranch(
      {
        name: 'Igreja Teste',
        withBranch: true,
        branchName: 'Sede',
      },
      mockUserData
    )

    expect(prisma.permission.createMany).toHaveBeenCalled()
  })

  it('deve usar nome padrão "Sede" se branchName não for fornecido', async () => {
    vi.mocked(prisma.church.create).mockResolvedValue({
      id: 'church-123',
      name: 'Igreja Teste',
    } as any)
    vi.mocked(prisma.branch.create).mockResolvedValue({
      id: 'branch-123',
      name: 'Sede',
    } as any)
    vi.mocked(prisma.member.findFirst).mockResolvedValue(null) // Não existe, então cria novo
    vi.mocked(prisma.member.create).mockResolvedValue({
      id: 'member-123',
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserData as any)
    vi.mocked(prisma.permission.findMany).mockResolvedValue([])
    vi.mocked(prisma.permission.createMany).mockResolvedValue({ count: 0 })

    await service.createChurchWithMainBranch(
      {
        name: 'Igreja Teste',
        withBranch: true,
      },
      mockUserData
    )

    expect(prisma.branch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Sede',
        }),
      })
    )
  })
})

