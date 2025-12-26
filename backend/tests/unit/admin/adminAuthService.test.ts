// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AdminAuthService } from '../../../src/services/adminAuthService'
import { prisma } from '../../../src/lib/prisma'
import { resetTestDatabase } from '../../utils/resetTestDatabase'
import { createAdminUser, cleanupAdminUsers } from '../../utils/adminTestHelpers'
import { AdminRole } from '@prisma/client'

describe('AdminAuthService - Unit Tests', () => {
  const adminAuthService = new AdminAuthService()
  let testAdmin: any

  beforeAll(async () => {
    await resetTestDatabase()
    testAdmin = await createAdminUser({
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: 'password123',
      adminRole: AdminRole.SUPERADMIN,
      isActive: true,
    })
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
  })

  describe('ADM_UNIT_AUTH_TS001_TC001: validateAdminCredentials - sucesso', () => {
    it('deve validar credenciais corretas e retornar admin', async () => {
      const result = await adminAuthService.validateAdminCredentials(
        'testadmin@test.com',
        'password123'
      )

      expect(result).toHaveProperty('admin')
      expect(result.admin).toBeDefined()
      expect(result.admin.email).toBe('testadmin@test.com')
      expect(result.admin.adminRole).toBe(AdminRole.SUPERADMIN)
      expect(result.admin.isActive).toBe(true)
    })
  })

  describe('ADM_UNIT_AUTH_TS001_TC002: validateAdminCredentials - email não encontrado', () => {
    it('deve retornar userNotFound quando email não existe', async () => {
      const result = await adminAuthService.validateAdminCredentials(
        'nonexistent@test.com',
        'password123'
      )

      expect(result).toHaveProperty('userNotFound')
      expect(result.userNotFound).toBe(true)
    })
  })

  describe('ADM_UNIT_AUTH_TS001_TC003: validateAdminCredentials - senha incorreta', () => {
    it('deve retornar invalidPassword quando senha está incorreta', async () => {
      const result = await adminAuthService.validateAdminCredentials(
        'testadmin@test.com',
        'wrongpassword'
      )

      expect(result).toHaveProperty('invalidPassword')
      expect(result.invalidPassword).toBe(true)
    })
  })

  describe('ADM_UNIT_AUTH_TS001_TC004: validateAdminCredentials - admin inativo', () => {
    it('deve retornar inactive quando admin está inativo', async () => {
      const inactiveAdmin = await createAdminUser({
        name: 'Inactive Admin',
        email: 'inactive@test.com',
        password: 'password123',
        adminRole: AdminRole.SUPPORT,
        isActive: false,
      })

      const result = await adminAuthService.validateAdminCredentials(
        'inactive@test.com',
        'password123'
      )

      expect(result).toHaveProperty('inactive')
      expect(result.inactive).toBe(true)

      // Limpa o admin inativo
      await prisma.adminUser.delete({ where: { id: inactiveAdmin.id } })
    })
  })

  describe('loginAdmin - sucesso', () => {
    it('deve fazer login e retornar token e dados do admin', async () => {
      const result = await adminAuthService.loginAdmin(
        'testadmin@test.com',
        'password123'
      )

      expect(result).toHaveProperty('token')
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')

      expect(result).toHaveProperty('admin')
      expect(result.admin.email).toBe('testadmin@test.com')
      expect(result.admin.adminRole).toBe(AdminRole.SUPERADMIN)
      expect(result.admin).not.toHaveProperty('passwordHash')

      // Verifica se lastLoginAt foi atualizado
      const updatedAdmin = await prisma.adminUser.findUnique({
        where: { id: testAdmin.id },
      })
      expect(updatedAdmin?.lastLoginAt).toBeDefined()
    })
  })

  describe('loginAdmin - erros', () => {
    it('deve lançar erro quando email não existe', async () => {
      await expect(
        adminAuthService.loginAdmin('nonexistent@test.com', 'password123')
      ).rejects.toThrow('Email não encontrado')
    })

    it('deve lançar erro quando senha está incorreta', async () => {
      await expect(
        adminAuthService.loginAdmin('testadmin@test.com', 'wrongpassword')
      ).rejects.toThrow('Senha incorreta')
    })

    it('deve lançar erro quando admin está inativo', async () => {
      const inactiveAdmin = await createAdminUser({
        name: 'Inactive Admin 2',
        email: 'inactive2@test.com',
        password: 'password123',
        adminRole: AdminRole.SUPPORT,
        isActive: false,
      })

      await expect(
        adminAuthService.loginAdmin('inactive2@test.com', 'password123')
      ).rejects.toThrow('Conta de administrador está inativa')

      // Limpa o admin inativo
      await prisma.adminUser.delete({ where: { id: inactiveAdmin.id } })
    })
  })
})






