// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AdminUserService } from '../../../src/services/adminUserService'
import { prisma } from '../../../src/lib/prisma'
import { resetTestDatabase } from '../../utils/resetTestDatabase'
import bcrypt from 'bcryptjs'
import { AdminRole } from '@prisma/client'

describe('AdminUserService - Unit Tests', () => {
  const userService = new AdminUserService()
  let testUser: any
  let testPlan: any
  let adminUserId: string

  beforeAll(async () => {
    await resetTestDatabase()

    // Cria admin para usar nos testes (usa email único com timestamp)
    const uniqueEmail = `testadmin-userservice-${Date.now()}@test.com`
    const admin = await prisma.adminUser.create({
      data: {
        name: 'Test Admin',
        email: uniqueEmail,
        passwordHash: await bcrypt.hash('password123', 10),
        adminRole: AdminRole.SUPERADMIN,
      },
    })
    adminUserId = admin.id

    // Cria plano e usuário de teste
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      },
    })

    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@test.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: testPlan.id,
            status: 'active',
          },
        },
      },
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
  })

  describe('ADM_UNIT_USERS_TS001_TC001: Regra - usuário bloqueado não acessa', () => {
    it('deve bloquear usuário e verificar que isBlocked é true', async () => {
      await userService.blockUser(testUser.id, adminUserId)

      const blockedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      })

      expect(blockedUser?.isBlocked).toBe(true)

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'USER_BLOCKED',
          entityId: testUser.id,
        },
      })
      expect(auditLog).toBeDefined()

      // Desbloqueia para não afetar outros testes
      await userService.unblockUser(testUser.id, adminUserId)
    })
  })

  describe('getAllUsers - filtros e paginação', () => {
    it('deve filtrar usuários por status bloqueado', async () => {
      const blockedUser = await prisma.user.create({
        data: {
          name: 'Blocked User',
          email: 'blocked@test.com',
          password: await bcrypt.hash('password123', 10),
          isBlocked: true,
        },
      })

      const result = await userService.getAllUsers(
        { status: 'blocked' },
        { page: 1, limit: 10 }
      )

      expect(result.users.length).toBeGreaterThan(0)
      expect(result.users.some((u) => u.id === blockedUser.id)).toBe(true)
      expect(result.users.every((u) => u.isBlocked === true)).toBe(true)
    })

    it('deve filtrar usuários por busca (email)', async () => {
      const result = await userService.getAllUsers(
        { search: 'testuser@test.com' },
        { page: 1, limit: 10 }
      )

      expect(result.users.length).toBeGreaterThan(0)
      expect(result.users[0].email).toContain('testuser@test.com')
    })
  })

  describe('getUserById - detalhes', () => {
    it('deve retornar detalhes completos do usuário', async () => {
      const user = await userService.getUserById(testUser.id)

      expect(user).toBeDefined()
      expect(user?.id).toBe(testUser.id)
      expect(user?.email).toBe(testUser.email)
      expect(user).toHaveProperty('churchesAsOwner')
      expect(user).toHaveProperty('churchesAsMember')
      expect(user).toHaveProperty('subscription')
    })

    it('deve retornar null quando usuário não existe', async () => {
      const user = await userService.getUserById('nonexistent-id')
      expect(user).toBeNull()
    })
  })

  describe('impersonateUser - permissões', () => {
    it('deve permitir SUPERADMIN impersonar', async () => {
      const result = await userService.impersonateUser(
        testUser.id,
        adminUserId,
        AdminRole.SUPERADMIN
      )

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('expiresIn')
    })

    it('deve permitir SUPPORT impersonar', async () => {
      const result = await userService.impersonateUser(
        testUser.id,
        adminUserId,
        AdminRole.SUPPORT
      )

      expect(result).toHaveProperty('token')
    })

    it('deve negar FINANCE impersonar', async () => {
      await expect(
        userService.impersonateUser(testUser.id, adminUserId, AdminRole.FINANCE)
      ).rejects.toThrow('Sem permissão para impersonar usuário')
    })
  })
})

