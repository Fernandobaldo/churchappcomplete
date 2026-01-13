// Unit tests para AdminAuthService
// Padrão obrigatório: 6 testes por módulo crítico
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminAuthService } from '../../../src/services/adminAuthService'
import { prisma } from '../../../src/lib/prisma'
import { AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock do Prisma - OBRIGATÓRIO em unit tests
vi.mock('../../../src/lib/prisma', () => ({
  prisma: {
    adminUser: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

// Mock do bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

// Mock do jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
  },
}))

describe('AdminAuthService - Unit Tests', () => {
  let service: AdminAuthService
  const mockAdminUserId = 'admin-test-123' // ID mock - não usar banco real
  const mockAdminUser = {
    id: mockAdminUserId,
    name: 'Test Admin',
    email: 'testadmin@test.com',
    adminRole: AdminRole.SUPERADMIN,
    isActive: true,
    passwordHash: 'hashed_password123',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  }

  beforeEach(() => {
    service = new AdminAuthService()
    vi.clearAllMocks()
    // Mock JWT_SECRET para evitar erro de env
    process.env.JWT_SECRET = 'test-secret-key'
  })

  describe('validateAdminCredentials', () => {
    // Teste 1: Success - Credenciais válidas
    it('deve validar credenciais corretas e retornar admin', async () => {
      // Arrange
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      // Act
      const result = await service.validateAdminCredentials(
        'testadmin@test.com',
        'password123'
      )

      // Assert
      expect(result).toHaveProperty('admin')
      expect(result.admin).toBeDefined()
      expect(result.admin.email).toBe('testadmin@test.com')
      expect(result.admin.adminRole).toBe(AdminRole.SUPERADMIN)
      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'testadmin@test.com' },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockAdminUser.passwordHash)
    })

    // Teste 2: Validation failure - Email não encontrado
    it('deve retornar userNotFound quando email não existe', async () => {
      // Arrange
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)

      // Act
      const result = await service.validateAdminCredentials(
        'nonexistent@test.com',
        'password123'
      )

      // Assert
      expect(result).toHaveProperty('userNotFound')
      expect(result.userNotFound).toBe(true)
      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@test.com' },
      })
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    // Teste 3: Validation failure - Senha incorreta
    it('deve retornar invalidPassword quando senha está incorreta', async () => {
      // Arrange
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      // Act
      const result = await service.validateAdminCredentials(
        'testadmin@test.com',
        'wrongpassword'
      )

      // Assert
      expect(result).toHaveProperty('invalidPassword')
      expect(result.invalidPassword).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockAdminUser.passwordHash)
    })

    // Teste 4: Validation failure - Admin inativo
    it('deve retornar inactive quando admin está inativo', async () => {
      // Arrange
      const inactiveAdmin = {
        ...mockAdminUser,
        isActive: false,
        email: 'inactive@test.com',
      }
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(inactiveAdmin as any)

      // Act
      const result = await service.validateAdminCredentials(
        'inactive@test.com',
        'password123'
      )

      // Assert
      expect(result).toHaveProperty('inactive')
      expect(result.inactive).toBe(true)
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })
  })

  describe('loginAdmin', () => {
    // Teste 5: Success - Login com sucesso
    it('deve fazer login e retornar token e dados do admin', async () => {
      // Arrange
      const updatedAdmin = {
        ...mockAdminUser,
        lastLoginAt: new Date(),
      }
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
      vi.mocked(prisma.adminUser.update).mockResolvedValue(updatedAdmin as any)
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

      // Act
      const result = await service.loginAdmin('testadmin@test.com', 'password123')

      // Assert
      expect(result).toHaveProperty('token')
      expect(result.token).toBe('mock-jwt-token')
      expect(result).toHaveProperty('admin')
      expect(result.admin.email).toBe('testadmin@test.com')
      expect(result.admin.adminRole).toBe(AdminRole.SUPERADMIN)
      expect(result.admin).not.toHaveProperty('passwordHash')
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockAdminUserId },
        data: { lastLoginAt: expect.any(Date) },
      })
      expect(prisma.auditLog.create).toHaveBeenCalled()
      expect(jwt.sign).toHaveBeenCalled()
    })

    // Teste 6: Validation failure - Email não encontrado no login
    it('deve lançar erro quando email não existe no login', async () => {
      // Arrange
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.loginAdmin('nonexistent@test.com', 'password123')
      ).rejects.toThrow('Email não encontrado')

      expect(prisma.adminUser.update).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    // Teste 7: Validation failure - Senha incorreta no login
    it('deve lançar erro quando senha está incorreta no login', async () => {
      // Arrange
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser as any)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      // Act & Assert
      await expect(
        service.loginAdmin('testadmin@test.com', 'wrongpassword')
      ).rejects.toThrow('Senha incorreta')

      expect(prisma.adminUser.update).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).not.toHaveBeenCalled()
    })

    // Teste 8: Validation failure - Admin inativo no login
    it('deve lançar erro quando admin está inativo no login', async () => {
      // Arrange
      const inactiveAdmin = {
        ...mockAdminUser,
        isActive: false,
        email: 'inactive@test.com',
      }
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(inactiveAdmin as any)

      // Act & Assert
      await expect(
        service.loginAdmin('inactive@test.com', 'password123')
      ).rejects.toThrow('Conta de administrador está inativa')

      expect(bcrypt.compare).not.toHaveBeenCalled()
      expect(prisma.adminUser.update).not.toHaveBeenCalled()
    })
  })
})
