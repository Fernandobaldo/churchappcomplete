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

describe('Admin Subscriptions Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let finance: any
  let support: any
  let superadminToken: string
  let financeToken: string
  let supportToken: string
  let testPlan: any
  let testUser: any
  let testSubscription: any

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
    finance = fixtures.finance
    support = fixtures.support

    // Faz login para obter tokens
    const superadminAuth = await loginAdmin(app, {
      email: 'superadmin@test.com',
      password: 'password123',
    })
    superadminToken = superadminAuth.token

    const financeAuth = await loginAdmin(app, {
      email: 'finance@test.com',
      password: 'password123',
    })
    financeToken = financeAuth.token

    const supportAuth = await loginAdmin(app, {
      email: 'support@test.com',
      password: 'password123',
    })
    supportToken = supportAuth.token

    // Cria plano, usuário e assinatura de teste
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
      },
    })

    testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
      },
    })
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_SUBS_TS001_TC001: GET /admin/subscriptions - listar assinaturas', () => {
    it('deve listar assinaturas com paginação', async () => {
      const response = await request(app.server)
        .get('/admin/subscriptions')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('subscriptions')
      expect(response.body).toHaveProperty('page')
      expect(response.body).toHaveProperty('total')
      expect(Array.isArray(response.body.subscriptions)).toBe(true)
    })

    it('deve permitir FINANCE listar assinaturas', async () => {
      const response = await request(app.server)
        .get('/admin/subscriptions')
        .set('Authorization', `Bearer ${financeToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
    })
  })

  describe('ADM_API_SUBS_TS001_TC002: GET /admin/subscriptions?status=active - filtrar por status', () => {
    it('deve filtrar assinaturas por status', async () => {
      const response = await request(app.server)
        .get('/admin/subscriptions')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.subscriptions.every((s: any) => s.status === 'active')).toBe(true)
    })
  })

  describe('ADM_API_SUBS_TS001_TC003: GET /admin/subscriptions/:id - detalhes', () => {
    it('deve retornar detalhes da assinatura', async () => {
      const response = await request(app.server)
        .get(`/admin/subscriptions/${testSubscription.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('plan')
    })
  })

  describe('ADM_API_SUBS_TS001_TC004: PATCH /admin/subscriptions/:id/plan - trocar plano (SUPERADMIN/FINANCE)', () => {
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
        .patch(`/admin/subscriptions/${testSubscription.id}/plan`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ planId: newPlan.id })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
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
        .patch(`/admin/subscriptions/${testSubscription.id}/plan`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ planId: newPlan.id })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
    })
  })

  describe('ADM_API_SUBS_TS001_TC005: PATCH /admin/subscriptions/:id/cancel - cancelar (SUPERADMIN/FINANCE)', () => {
    it('deve cancelar assinatura quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .patch(`/admin/subscriptions/${testSubscription.id}/cancel`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      const cancelledSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id },
      })
      expect(cancelledSubscription?.status).toBe('cancelled')
    })
  })

  describe('SUPPORT não pode acessar assinaturas', () => {
    it('deve negar acesso quando SUPPORT tenta listar assinaturas', async () => {
      const response = await request(app.server)
        .get('/admin/subscriptions')
        .set('Authorization', `Bearer ${supportToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })
  })
})

