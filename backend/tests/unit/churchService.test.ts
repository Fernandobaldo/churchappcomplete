import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChurchService } from '../../src/services/churchService'
import { prisma } from '../../src/lib/prisma'

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password, rounds) => Promise.resolve(`hashed_${password}`)),
  },
}))

vi.mock('../../src/lib/prisma', () => {
  const mockMember = {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(), // Adicionado para o novo modelo
    findFirst: vi.fn(), // Adicionado para verificar por userId ou email
  }

  const mock = {
    church: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    branch: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    member: mockMember,
    permission: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => {
      // Mock da transação precisa incluir todos os métodos com as mesmas funções
      const tx = {
        church: mock.church,
        branch: {
          ...mock.branch,
          findMany: vi.fn(), // Mock separado para a transação
        },
        member: {
          create: mockMember.create,
          update: mockMember.update,
          findUnique: mockMember.findUnique, // Usa a mesma função mockada
          findFirst: mockMember.findFirst, // Adicionado para verificar por userId ou email
          deleteMany: vi.fn(), // Adicionado para deletar membros
        },
        permission: {
          ...mock.permission,
          deleteMany: vi.fn(), // Mock separado para a transação
        },
      }
      return fn(tx)
    }),
  }

  return { prisma: mock }
})

const service = new ChurchService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChurchService - Unit Tests', () => {
  // Teste 1: Success - Criar igreja com filial e membro
  it('deve criar uma igreja com filial principal e membro administrador', async () => {
    // Arrange
//     const mockChurch = { id: 'church1', name: 'Igreja Teste' }

const mockChurch = {
  church: {
    id: 'church1',
    name: 'Igreja Teste',
    isActive: true,
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
      isActive: true,
    })
    prisma.branch.create.mockResolvedValue(mockBranch)
    // NOVO MODELO: Verifica se Member existe antes de criar
    // No contexto da transação, precisa mockar tx.member.findFirst
    // Mas como o mock usa a mesma função, funciona
    prisma.member.findFirst.mockResolvedValue(null) // Não existe, então cria novo
    prisma.member.create.mockResolvedValue(mockMember)
    prisma.permission.findMany.mockResolvedValue(mockPermissions)
    prisma.permission.createMany.mockResolvedValue({ count: mockPermissions.length })
    
    // Garante que a transação retorna o resultado esperado
    prisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        church: prisma.church,
        branch: prisma.branch,
        member: prisma.member, // Usa o mesmo mock
        permission: prisma.permission,
      }
      return await fn(tx)
    })

    // Act
    const result = await service.createChurchWithMainBranch(
      {
        name: 'Igreja Teste',
        branchName: 'Sede',
        pastorName: 'Pastor Teste',
      },
      {
        id: 'user1',
          name: 'Admin',
          email: 'admin@teste.com',
          password: '123456',
      }
    )

    // Assert
    expect(result).toEqual(mockChurch)
    expect(prisma.church.create).toHaveBeenCalled()
    expect(prisma.branch.create).toHaveBeenCalled()
    expect(prisma.member.create).toHaveBeenCalled()
    expect(prisma.permission.createMany).toHaveBeenCalled()
    
    // NOVO MODELO: Verifica que Member foi criado SEM senha
    const memberCreateCall = (prisma.member.create as any).mock.calls[0]
    if (memberCreateCall && memberCreateCall[0] && memberCreateCall[0].data) {
      expect(memberCreateCall[0].data).not.toHaveProperty('password')
      expect(memberCreateCall[0].data).toHaveProperty('userId')
    }
  })

  // Teste 2: Dependency failure propagation - Erro ao criar
  it('deve lidar com erro ao criar igreja', async () => {
    // Arrange
    prisma.church.create.mockRejectedValue(new Error('Erro inesperado'))

    // Act & Assert
    await expect(
      service.createChurchWithMainBranch(
        {
          name: 'Igreja com Erro',
          branchName: 'Sede',
          pastorName: 'Pastor Teste',
        },
        {
          id: 'user1',
            name: 'Admin',
            email: 'admin@erro.com',
            password: '123456',
        }
      )
    ).rejects.toThrow('Erro inesperado')
  })

  // Teste 3: Success - Buscar igreja por id
  it('deve buscar igreja por id', async () => {
    // Arrange
    const churchMock = { id: '123', name: 'Igreja Buscada' }
    prisma.church.findUnique.mockResolvedValue(churchMock)

    // Act
    const result = await service.getChurchById('123')

    // Assert
    expect(result).toEqual(churchMock)
    expect(prisma.church.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
      include: { Branch: true },
    })
  })

  // Teste 4: Success - Atualizar igreja
  it('deve atualizar igreja', async () => {
    // Arrange
    const churchMock = { id: '123', name: 'Atualizada' }
    prisma.church.update.mockResolvedValue(churchMock)

    // Act
    const result = await service.updateChurch('123', { name: 'Atualizada' })

    // Assert
    expect(result).toEqual(churchMock)
    expect(prisma.church.update).toHaveBeenCalledWith({ where: { id: '123' }, data: { name: 'Atualizada' } })
  })

  // Teste 5: Success - Deletar igreja
  it('deve deletar igreja', async () => {
    // Arrange
    const mockBranches = [
     { 
       id: 'branch1',
       Member: [
         { id: 'member1' },
         { id: 'member2' },
       ],
     },
     { 
       id: 'branch2',
       Member: [
         { id: 'member3' },
       ],
     },
   ]

   // Mock da transação com branches que incluem Member
   prisma.$transaction.mockImplementation(async (fn: any) => {
     const tx = {
       church: prisma.church,
       branch: {
         findMany: vi.fn().mockResolvedValue(mockBranches),
         deleteMany: vi.fn().mockResolvedValue({}),
       },
       member: {
         deleteMany: vi.fn().mockResolvedValue({}),
       },
       permission: {
         deleteMany: vi.fn().mockResolvedValue({}),
       },
     }
     return await fn(tx)
   })

    prisma.church.delete.mockResolvedValue({ id: '123' })

    // Act
    const result = await service.deleteChurch('123')

    // Assert
    expect(result).toEqual({ id: '123' })
   expect(prisma.church.delete).toHaveBeenCalledWith({ where: { id: '123' } })
 })

  describe('getAllChurches', () => {
    // Teste 6: Edge case #1 - branchId null
    it('deve retornar array vazio quando usuário não tem branchId', async () => {
      // Arrange (não precisa de mocks)
      
      // Act
      const result = await service.getAllChurches(null)
      
      // Assert
      expect(result).toEqual([])
      expect(prisma.branch.findUnique).not.toHaveBeenCalled()
      expect(prisma.church.findMany).not.toHaveBeenCalled()
    })

    // Teste 7: Edge case #2 - branchId inválido
    it('deve retornar array vazio quando branchId não existe', async () => {
      // Arrange
      prisma.branch.findUnique.mockResolvedValue(null)
      
      // Act
      const result = await service.getAllChurches('invalid-branch-id')
      
      // Assert
      expect(result).toEqual([])
      expect(prisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: 'invalid-branch-id' },
        include: {
          Church: {
            include: {
              Branch: true,
            },
          },
        },
      })
    })

    // Teste 8: Success - Retornar igreja com branchId válido
    it('deve retornar apenas a igreja da branch do usuário quando tem branchId válido', async () => {
      // Arrange
      const mockBranch = {
        id: 'branch-123',
        name: 'Sede',
        Church: {
          id: 'church-123',
          name: 'Igreja do Usuário',
          isActive: true,
          Branch: [
            { id: 'branch-123', name: 'Sede' },
            { id: 'branch-456', name: 'Filial 1' },
          ],
        },
      }

      prisma.branch.findUnique.mockResolvedValue(mockBranch)
      
      // Act
      const result = await service.getAllChurches('branch-123')
      
      // Assert
      expect(result).toEqual([mockBranch.Church])
      expect(prisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: 'branch-123' },
        include: {
          Church: {
            include: {
              Branch: true,
            },
          },
        },
      })
    })
  })
})
