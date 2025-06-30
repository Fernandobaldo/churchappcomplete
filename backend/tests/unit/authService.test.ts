import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../../src/services/authService'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    member: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}))

const authService = new AuthService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthService', () => {
  it('deve fazer login com sucesso', async () => {
    const member = { id: '123', email: 'admin@test.com', password: 'hashed' }
    prisma.member.findFirst.mockResolvedValue(member)
    bcrypt.compare.mockResolvedValue(true)

    const result = await authService.login('admin@test.com', '123456')

    expect(result).toEqual(member)
    expect(prisma.member.findFirst).toHaveBeenCalledWith({ where: { email: 'admin@test.com' } })
    expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed')
  })

  it('deve lançar erro se a senha estiver incorreta', async () => {
    const member = { id: '123', email: 'admin@test.com', password: 'hashed' }
    prisma.member.findFirst.mockResolvedValue(member)
    bcrypt.compare.mockResolvedValue(false)

    await expect(authService.login('admin@test.com', 'errada')).rejects.toThrow('Credenciais inválidas')
  })

  it('deve lançar erro se o usuário não for encontrado', async () => {
    prisma.member.findFirst.mockResolvedValue(null)

    await expect(authService.login('naoexiste@test.com', '123456')).rejects.toThrow('Credenciais inválidas')
  })

  it('deve lançar erro se algo inesperado ocorrer', async () => {
    prisma.member.findFirst.mockRejectedValue(new Error('Erro inesperado'))

    await expect(authService.login('admin@test.com', '123456')).rejects.toThrow('Erro inesperado')
  })
})
