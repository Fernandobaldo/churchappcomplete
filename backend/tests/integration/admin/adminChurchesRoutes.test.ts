// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import request from 'supertest'
import { registerRoutes } from '../../../src/routes/registerRoutes'
import { resetTestDatabase } from '../../utils/resetTestDatabase'
import {
  createAdminUsersFixtures,
  loginAdmin,
  cleanupAdminUsers,
} from '../../utils/adminTestHelpers'
import { AdminRole } from '@prisma/client'
import { prisma } from '../../../src/lib/prisma'
import { logTestResponse } from '../../utils/testResponseHelper'
import bcrypt from 'bcryptjs'

describe('Admin Churches Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let support: any
  let finance: any
  let superadminToken: string
  let supportToken: string
  let financeToken: string
  let testChurch: any
  let testPlan: any
  let testUser: any

  beforeAll(async () => {
    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    // Decora o app com authenticate para as rotas que precisam
    const { authenticate } = await import('../../../src/middlewares/authenticate')
    app.decorate('authenticate', authenticate)

    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()

    // Cria AdminUsers de teste
    const fixtures = await createAdminUsersFixtures()
    superadmin = fixtures.superadmin
    support = fixtures.support
    finance = fixtures.finance

    // Faz login para obter tokens
    const superadminAuth = await loginAdmin(app, {
      email: 'superadmin@test.com',
      password: 'password123',
    })
    superadminToken = superadminAuth.token

    const supportAuth = await loginAdmin(app, {
      email: 'support@test.com',
      password: 'password123',
    })
    supportToken = supportAuth.token

    const financeAuth = await loginAdmin(app, {
      email: 'finance@test.com',
      password: 'password123',
    })
    financeToken = financeAuth.token

    // Cria plano, usuário, igreja e branch de teste
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
        name: 'Church Owner',
        email: 'churchowner@test.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: testPlan.id,
            status: 'active',
          },
        },
      },
    })

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
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_CHURCHES_TS001_TC001: GET /admin/churches - listar com filtros', () => {
    it('deve listar igrejas com paginação', async () => {
      const response = await request(app.server)
        .get('/admin/churches')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('churches')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.churches)).toBe(true)
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC002: GET /admin/churches?plan=Free - filtrar por plano', () => {
    it('deve filtrar igrejas por plano', async () => {
      const response = await request(app.server)
        .get('/admin/churches')
        .query({ planId: testPlan.id })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.churches.length).toBeGreaterThan(0)
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC003: GET /admin/churches?status=active - filtrar por status', () => {
    it('deve filtrar igrejas por status ativo', async () => {
      const response = await request(app.server)
        .get('/admin/churches')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.churches.every((c: any) => c.isActive === true)).toBe(true)
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC004: GET /admin/churches/:id - detalhes da igreja', () => {
    it('deve retornar detalhes completos da igreja', async () => {
      const response = await request(app.server)
        .get(`/admin/churches/${testChurch.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('name')
      expect(response.body).toHaveProperty('owner')
      expect(response.body).toHaveProperty('branches')
      expect(response.body).toHaveProperty('membersCount')
      expect(response.body).toHaveProperty('plan')
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC005: GET /admin/churches/:id/branches - branches da igreja', () => {
    it('deve retornar branches da igreja', async () => {
      const response = await request(app.server)
        .get(`/admin/churches/${testChurch.id}/branches`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC006: GET /admin/churches/:id/members - membros da igreja', () => {
    it('deve retornar membros da igreja com paginação', async () => {
      const response = await request(app.server)
        .get(`/admin/churches/${testChurch.id}/members`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('members')
      expect(response.body).toHaveProperty('pagination')
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC007: PATCH /admin/churches/:id/suspend - suspender (SUPERADMIN)', () => {
    it('deve suspender igreja quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .patch(`/admin/churches/${testChurch.id}/suspend`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verifica se foi suspensa
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
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC008: PATCH /admin/churches/:id/reactivate - reativar (SUPERADMIN)', () => {
    it('deve reativar igreja quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .patch(`/admin/churches/${testChurch.id}/reactivate`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verifica se foi reativada
      const reactivatedChurch = await prisma.church.findUnique({
        where: { id: testChurch.id },
      })
      expect(reactivatedChurch?.isActive).toBe(true)
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC009: PATCH /admin/churches/:id/plan - trocar plano (SUPERADMIN/FINANCE)', () => {
    it('deve trocar plano quando SUPERADMIN', async () => {
      const newPlan = await prisma.plan.create({
        data: {
          name: 'New Plan',
          price: 99.99,
          features: ['advanced'],
          maxMembers: 100,
          maxBranches: 5,
        },
      })

      const response = await request(app.server)
        .patch(`/admin/churches/${testChurch.id}/plan`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ planId: newPlan.id })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

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

    it('deve permitir FINANCE trocar plano', async () => {
      const newPlan = await prisma.plan.create({
        data: {
          name: 'Finance Plan',
          price: 49.99,
          features: ['basic'],
          maxMembers: 50,
          maxBranches: 3,
        },
      })

      const response = await request(app.server)
        .patch(`/admin/churches/${testChurch.id}/plan`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ planId: newPlan.id })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
    })
  })

  describe('ADM_API_CHURCHES_TS001_TC010: Suspender igreja - SUPPORT não pode', () => {
    it('deve negar acesso quando SUPPORT tenta suspender', async () => {
      const churchToSuspend = await prisma.church.create({
        data: {
          name: 'Church to Suspend',
          isActive: true,
        },
      })

      const response = await request(app.server)
        .patch(`/admin/churches/${churchToSuspend.id}/suspend`)
        .set('Authorization', `Bearer ${supportToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })
})

