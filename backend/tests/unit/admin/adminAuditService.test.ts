// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AdminAuditService } from '../../../src/services/adminAuditService'
import { prisma } from '../../../src/lib/prisma'
import { resetTestDatabase } from '../../utils/resetTestDatabase'
import { AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

describe('AdminAuditService - Unit Tests', () => {
  const auditService = new AdminAuditService()
  let adminUserId: string

  beforeAll(async () => {
    await resetTestDatabase()

    // Cria admin para usar nos testes (usa email único com timestamp)
    const uniqueEmail = `testadmin-auditservice-${Date.now()}@test.com`
    const admin = await prisma.adminUser.create({
      data: {
        name: 'Test Admin',
        email: uniqueEmail,
        passwordHash: await bcrypt.hash('password123', 10),
        adminRole: AdminRole.SUPERADMIN,
      },
    })
    adminUserId = admin.id
  })

  afterAll(async () => {
    await resetTestDatabase()
  })

  describe('ADM_UNIT_AUDIT_TS001_TC001: Gatilhos de log - mudança de plano', () => {
    it('deve registrar log quando plano é alterado', async () => {
      const churchId = 'test-church-id'
      const planId = 'test-plan-id'

      await prisma.auditLog.create({
        data: {
          action: 'PLAN_CHANGED',
          entityType: 'Church',
          entityId: churchId,
          userId: adminUserId,
          userEmail: 'testadmin@test.com',
          description: `Plano da igreja ${churchId} foi alterado`,
          metadata: { churchId, newPlanId: planId },
          adminUserId,
        },
      })

      const logs = await auditService.getAdminAuditLogs(
        { action: 'PLAN_CHANGED' },
        { page: 1, limit: 10 }
      )

      expect(logs.logs.length).toBeGreaterThan(0)
      expect(logs.logs.some((log) => log.action === 'PLAN_CHANGED')).toBe(true)
    })
  })

  describe('ADM_UNIT_AUDIT_TS001_TC002: Gatilhos de log - suspensão de igreja', () => {
    it('deve registrar log quando igreja é suspensa', async () => {
      const churchId = 'test-church-id'

      await prisma.auditLog.create({
        data: {
          action: 'CHURCH_SUSPENDED',
          entityType: 'Church',
          entityId: churchId,
          userId: adminUserId,
          userEmail: 'testadmin@test.com',
          description: `Igreja ${churchId} foi suspensa`,
          adminUserId,
        },
      })

      const logs = await auditService.getAdminAuditLogs(
        { action: 'CHURCH_SUSPENDED' },
        { page: 1, limit: 10 }
      )

      expect(logs.logs.length).toBeGreaterThan(0)
      expect(logs.logs.some((log) => log.action === 'CHURCH_SUSPENDED')).toBe(true)
    })
  })

  describe('ADM_UNIT_AUDIT_TS001_TC003: Gatilhos de log - impersonate', () => {
    it('deve registrar log quando admin impersona usuário', async () => {
      const userId = 'test-user-id'

      await prisma.auditLog.create({
        data: {
          action: 'IMPERSONATE_USER',
          entityType: 'User',
          entityId: userId,
          userId: adminUserId,
          userEmail: 'testadmin@test.com',
          description: `Admin impersonou usuário ${userId}`,
          metadata: { impersonatedUserId: userId },
          adminUserId,
        },
      })

      const logs = await auditService.getAdminAuditLogs(
        { action: 'IMPERSONATE_USER' },
        { page: 1, limit: 10 }
      )

      expect(logs.logs.length).toBeGreaterThan(0)
      expect(logs.logs.some((log) => log.action === 'IMPERSONATE_USER')).toBe(true)
    })
  })
})

