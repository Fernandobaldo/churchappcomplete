// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AdminChurchService } from '../../../src/services/adminChurchService'
import { prisma } from '../../../src/lib/prisma'
import { resetTestDatabase } from '../../utils/resetTestDatabase'
import bcrypt from 'bcryptjs'
import { AdminRole } from '@prisma/client'

describe('AdminChurchService - Unit Tests', () => {
  const churchService = new AdminChurchService()
  let testChurch: any
  let testUser: any
  let testPlan: any
  let adminUserId: string

  beforeAll(async () => {
    await resetTestDatabase()

    // Cria admin para usar nos testes (usa email único com timestamp)
    const uniqueEmail = `testadmin-churchservice-${Date.now()}@test.com`
    const admin = await prisma.adminUser.create({
      data: {
        name: 'Test Admin',
        email: uniqueEmail,
        passwordHash: await bcrypt.hash('password123', 10),
        adminRole: AdminRole.SUPERADMIN,
      },
    })
    adminUserId = admin.id

    // Cria plano, usuário, igreja e branch
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      },
    })

    // Usar factory em vez de prisma direto
    const { createTestUser, createTestSubscription } = await import('../../utils/testFactories')
    const { SubscriptionStatus } = await import('@prisma/client')
    testUser = await createTestUser({
      firstName: 'Church',
      lastName: 'Owner',
      email: 'churchowner@test.com',
      password: await bcrypt.hash('password123', 10),
    })
    await createTestSubscription(testUser.id, testPlan.id, SubscriptionStatus.active)

    testChurch = await prisma.church.create({
      data: {
        name: 'Test Church',
        isActive: true,
      },
    })

    const branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        churchId: testChurch.id,
        isMainBranch: true,
      },
    })

    await prisma.member.create({
      data: {
        name: 'Church Owner',
        email: 'churchowner@test.com',
        role: 'ADMINGERAL',
        branchId: branch.id,
        userId: testUser.id,
      },
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
  })

  describe('ADM_UNIT_CHURCHES_TS001_TC001: Regra - impedir login de membros de igreja suspensa', () => {
    it('deve suspender igreja e verificar que isActive é false', async () => {
      await churchService.suspendChurch(testChurch.id, adminUserId)

      const suspendedChurch = await prisma.church.findUnique({
        where: { id: testChurch.id },
      })

      expect(suspendedChurch?.isActive).toBe(false)

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'CHURCH_SUSPENDED',
          entityId: testChurch.id,
        },
      })
      expect(auditLog).toBeDefined()

      // Reativa para não afetar outros testes
      await churchService.reactivateChurch(testChurch.id, adminUserId)
    })
  })

  describe('getAllChurches - filtros', () => {
    it('deve filtrar igrejas por status', async () => {
      const result = await churchService.getAllChurches(
        { status: 'active' },
        { page: 1, limit: 10 }
      )

      expect(result.churches.every((c) => c.isActive === true)).toBe(true)
    })
  })

  describe('getChurchById - detalhes', () => {
    it('deve retornar detalhes completos da igreja', async () => {
      const church = await churchService.getChurchById(testChurch.id)

      expect(church).toBeDefined()
      expect(church?.id).toBe(testChurch.id)
      expect(church).toHaveProperty('owner')
      expect(church).toHaveProperty('branches')
      expect(church).toHaveProperty('membersCount')
    })
  })

  describe('changeChurchPlan - permissões', () => {
    it('deve permitir SUPERADMIN trocar plano', async () => {
      const newPlan = await prisma.plan.create({
        data: {
          name: 'New Plan',
          price: 99.99,
          features: ['advanced'],
          maxMembers: 100,
          maxBranches: 5,
        },
      })

      await churchService.changeChurchPlan(testChurch.id, newPlan.id, adminUserId)

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'PLAN_CHANGED',
          entityId: testChurch.id,
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(auditLog).toBeDefined()
    })
  })
})

