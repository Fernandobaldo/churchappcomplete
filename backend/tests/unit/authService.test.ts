import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { AuthService } from '../../src/services/authService'
import { prisma } from '../../src/lib/prisma'

// Mock do bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
  compare: vi.fn(),
}))

// Mock do prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    member: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
  },
}))

const authService = new AuthService()

describe('AuthService - Novo Modelo User + Member', () => {
  const mockUserWithMember = {
    id: 'user-1',
    email: 'member@example.com',
    name: 'Membro Teste',
    password: 'hashed_password',
    Member: {
      id: 'member-1',
      email: 'member@example.com',
      name: 'Membro Teste',
      role: 'ADMINGERAL',
      branchId: 'branch-1',
      Permission: [
        { type: 'members_manage' },
        { type: 'events_manage' },
      ],
      Branch: {
        id: 'branch-1',
        Church: {
          id: 'church-1',
          name: 'Igreja Teste',
        },
      },
    },
  }

  const mockUserWithoutMember = {
    id: 'user-2',
    email: 'admin@example.com',
    name: 'Admin SaaS',
    password: 'hashed_password',
    Member: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateCredentials', () => {
    it('deve retornar objeto com userNotFound se User não existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await authService.validateCredentials('naoexiste@example.com', '123456')

      // A implementação retorna um objeto especial para indicar que o usuário não foi encontrado
      expect(result).toEqual({ userNotFound: true })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'naoexiste@example.com' },
        include: {
          Member: {
            include: {
              Permission: true,
              Branch: {
                include: {
                  Church: true,
                },
              },
            },
          },
        },
      })
    })

    it('deve retornar objeto com invalidPassword se senha do User estiver incorreta', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithMember)
      ;(bcrypt.compare as vi.Mock).mockResolvedValue(false)

      const result = await authService.validateCredentials('member@example.com', 'wrongpass')

      // A implementação retorna um objeto especial para indicar que a senha está incorreta
      expect(result).toEqual({ invalidPassword: true })
    })

    it('deve retornar type: member quando User tem Member associado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithMember)
      ;(bcrypt.compare as vi.Mock).mockResolvedValue(true)

      const result = await authService.validateCredentials('member@example.com', '123456')

      expect(result).not.toBeNull()
      expect(result?.type).toBe('member')
      expect(result?.user).toBeDefined()
      expect(result?.member).toBeDefined()
      expect(result?.member?.id).toBe('member-1')
      expect(result?.member?.role).toBe('ADMINGERAL')
    })

    it('deve retornar type: user quando User não tem Member associado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithoutMember)
      ;(bcrypt.compare as vi.Mock).mockResolvedValue(true)

      const result = await authService.validateCredentials('admin@example.com', '123456')

      expect(result).not.toBeNull()
      expect(result?.type).toBe('user')
      expect(result?.user).toBeDefined()
      expect(result?.member).toBeNull()
    })
  })

  describe('login', () => {
    it('deve retornar token com contexto de Member quando User tem Member', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithMember)
      ;(bcrypt.compare as vi.Mock).mockResolvedValue(true)

      const result = await authService.login('member@example.com', '123456')

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('type')
      expect(result.type).toBe('member')
      expect(result.user.email).toBe('member@example.com')
      expect(result.user.memberId).toBe('member-1')
      expect(result.user.role).toBe('ADMINGERAL')
      expect(result.user.branchId).toBe('branch-1')
      expect(result.user.churchId).toBe('church-1')
      expect(result.user.permissions).toHaveLength(2)
    })

    it('deve retornar token sem contexto de Member quando User não tem Member', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithoutMember)
      prisma.member.findFirst.mockResolvedValue(null) // Não encontra Member associado
      prisma.member.findUnique.mockResolvedValue(null)
      ;(bcrypt.compare as vi.Mock).mockResolvedValue(true)

      const result = await authService.login('admin@example.com', '123456')

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('type')
      expect(result.type).toBe('user')
      expect(result.user.email).toBe('admin@example.com')
      expect(result.user.memberId).toBeUndefined()
      expect(result.user.role).toBeUndefined()
      expect(result.user.branchId).toBeUndefined()
      expect(result.user.churchId).toBeUndefined()
      // Permissions deve ser array vazio, não undefined
      expect(result.user.permissions).toBeDefined()
      expect(Array.isArray(result.user.permissions)).toBe(true)
      expect(result.user.permissions.length).toBe(0)
    })

    it('deve lançar erro se credenciais forem inválidas', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      // A implementação lança erro específico quando usuário não é encontrado
      await expect(authService.login('naoexiste@example.com', '123456')).rejects.toThrow('Usuário não encontrado')
    })
  })
})
