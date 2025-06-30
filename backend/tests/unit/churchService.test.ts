import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChurchService } from '../../src/services/churchService'
import { prisma } from '../../src/lib/prisma'

vi.mock('../../src/lib/prisma', () => {
  const mock = {
    church: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    branch: {
      create: vi.fn(),
     findMany: vi.fn(),
    },
    member: {
      create: vi.fn(),
      update: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(mock)),
  }

  return { prisma: mock }
})

const service = new ChurchService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChurchService', () => {
  it('deve criar uma igreja com filial principal e membro administrador', async () => {
//     const mockChurch = { id: 'church1', name: 'Igreja Teste' }

const mockChurch = {
  church: {
    id: 'church1',
    name: 'Igreja Teste',
  },
  branch: {
    id: 'branch1',
    name: 'Sede',
  },
  member: {
    id: 'member1',
    email: 'admin@teste.com',
  },
}

    const mockBranch = { id: 'branch1', name: 'Sede' }
    const mockMember = { id: 'member1', email: 'admin@teste.com' }
    const mockPermissions = [{ id: 'p1', type: 'church_manage' }]

    prisma.church.create.mockResolvedValue({
      id: 'church1',
      name: 'Igreja Teste',
    })
    prisma.branch.create.mockResolvedValue(mockBranch)
    prisma.member.create.mockResolvedValue(mockMember)
    prisma.permission.findMany.mockResolvedValue(mockPermissions)

    const result = await service.createChurchWithMainBranch(
      {
        name: 'Igreja Teste',
        ownerId: 'user1',
        branchName: 'Sede',
        pastorName: 'Pastor Teste',
        user: {
          name: 'Admin',
          email: 'admin@teste.com',
          password: '123456',
        },
      },
      true
    )

    expect(result).toEqual(mockChurch)
    expect(prisma.church.create).toHaveBeenCalled()
    expect(prisma.branch.create).toHaveBeenCalled()
    expect(prisma.member.create).toHaveBeenCalled()
    expect(prisma.permission.findMany).toHaveBeenCalled()
  })

  it('deve lidar com erro ao criar igreja', async () => {
    prisma.church.create.mockRejectedValue(new Error('Erro inesperado'))

    await expect(() =>
      service.createChurchWithMainBranch(
        {
          name: 'Igreja com Erro',
          ownerId: 'user1',
          branchName: 'Sede',
          pastorName: 'Pastor Teste',
          user: {
            name: 'Admin',
            email: 'admin@erro.com',
            password: '123456',
          },
        },
        true
      )
    ).rejects.toThrow('Erro inesperado')
  })

  it('deve buscar igreja por id', async () => {
    const churchMock = { id: '123', name: 'Igreja Buscada' }
    prisma.church.findUnique.mockResolvedValue(churchMock)

    const result = await service.getChurchById('123')
    expect(result).toEqual(churchMock)
    expect(prisma.church.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
      include: { branches: true },
    })
  })

  it('deve atualizar igreja', async () => {
    const churchMock = { id: '123', name: 'Atualizada' }
    prisma.church.update.mockResolvedValue(churchMock)

    const result = await service.updateChurch('123', { name: 'Atualizada' })
    expect(result).toEqual(churchMock)
    expect(prisma.church.update).toHaveBeenCalledWith({ where: { id: '123' }, data: { name: 'Atualizada' } })
  })

 it('deve deletar igreja', async () => {
   const mockBranches = [
     { id: 'branch1' },
     { id: 'branch2' },
   ]

   prisma.branch.findMany.mockResolvedValue(mockBranches)
   prisma.member.deleteMany = vi.fn().mockResolvedValue({})
   prisma.branch.deleteMany = vi.fn().mockResolvedValue({})
   prisma.church.delete.mockResolvedValue({ id: '123' })

   const result = await service.deleteChurch('123')

   expect(result).toEqual({ id: '123' })
   expect(prisma.branch.findMany).toHaveBeenCalledWith({ where: { churchId: '123' } })
   expect(prisma.member.deleteMany).toHaveBeenCalledTimes(mockBranches.length)
   for (const branch of mockBranches) {
     expect(prisma.member.deleteMany).toHaveBeenCalledWith({ where: { branchId: branch.id } })
   }
   expect(prisma.branch.deleteMany).toHaveBeenCalledWith({ where: { churchId: '123' } })
   expect(prisma.church.delete).toHaveBeenCalledWith({ where: { id: '123' } })
 })
})
