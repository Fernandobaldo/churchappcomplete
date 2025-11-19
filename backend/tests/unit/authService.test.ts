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
    member: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
  },
}))

const authService = new AuthService()

describe('AuthService', () => {
  const mockMember = {
    id: 'member-1',
    email: 'member@example.com',
    password: 'hashed_password',
    permissions: [{ type: 'members_manage' }],
  }

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    password: 'hashed_password',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar token e usuário ao fazer login com member válido', async () => {
    prisma.member.findUnique.mockResolvedValue(mockMember)
    prisma.user.findUnique.mockResolvedValue(null)
    ;(bcrypt.compare as vi.Mock).mockResolvedValue(true)

    const result = await authService.login('member@example.com', '123456')

    expect(result).toHaveProperty('token')
    expect(result).toHaveProperty('user')
    expect(result.user.email).toBe('member@example.com')
    expect(result.type).toBe('member')
  })

  it('deve retornar token e usuário ao fazer login com user válido', async () => {
    prisma.member.findUnique.mockResolvedValue(null)
    prisma.user.findUnique.mockResolvedValue(mockUser)
    ;(bcrypt.compare as vi.Mock).mockResolvedValue(true)

    const result = await authService.login('admin@example.com', '123456')

    expect(result).toHaveProperty('token')
    expect(result).toHaveProperty('user')
    expect(result.user.email).toBe('admin@example.com')
    expect(result.type).toBe('user')
  })

  it('deve lançar erro se e-mail não existir', async () => {
    prisma.member.findUnique.mockResolvedValue(null)
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(authService.login('naoexiste@example.com', '123456')).rejects.toThrow('Credenciais inválidas')
  })

  it('deve lançar erro se senha estiver incorreta para member', async () => {
    prisma.member.findUnique.mockResolvedValue(mockMember)
    prisma.user.findUnique.mockResolvedValue(null)
    ;(bcrypt.compare as vi.Mock).mockResolvedValue(false)

    await expect(authService.login('member@example.com', 'wrongpass')).rejects.toThrow('Credenciais inválidas')
  })

  it('deve lançar erro se senha estiver incorreta para user', async () => {
    prisma.member.findUnique.mockResolvedValue(null)
    prisma.user.findUnique.mockResolvedValue(mockUser)
    ;(bcrypt.compare as vi.Mock).mockResolvedValue(false)

    await expect(authService.login('admin@example.com', 'wrongpass')).rejects.toThrow('Credenciais inválidas')
  })
})
