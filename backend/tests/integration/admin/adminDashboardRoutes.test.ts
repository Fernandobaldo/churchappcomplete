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
import { resetTestDatabase } from '../../utils/db'
import {
  createAdminUsersFixtures,
  loginAdmin,
  cleanupAdminUsers,
} from '../../utils/adminTestHelpers'
import { logTestResponse } from '../../utils/testResponseHelper'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import {
  createTestPlan,
  createTestUser,
  createTestSubscription,
  createTestChurch,
  createTestBranch,
  createTestMember,
} from '../../utils/testFactories'
import { SubscriptionStatus } from '@prisma/client'

describe('Admin Dashboard Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let authToken: string

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

    // Faz login para obter token
    const authResult = await loginAdmin(app, {
      email: 'superadmin@test.com',
      password: 'password123',
    })
    authToken = authResult.token
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_DASHBOARD_TS001_TC001: GET /admin/dashboard/stats - retorna métricas', () => {
    it('deve retornar estatísticas do dashboard', async () => {
      const response = await request(app.server)
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('totalUsers')
      expect(response.body).toHaveProperty('totalChurches')
      expect(response.body).toHaveProperty('totalBranches')
      expect(response.body).toHaveProperty('totalMembers')
      expect(response.body).toHaveProperty('newUsersLast7Days')
      expect(response.body).toHaveProperty('newUsersLast30Days')
      expect(response.body).toHaveProperty('newChurchesLast7Days')
      expect(response.body).toHaveProperty('newChurchesLast30Days')
      expect(response.body).toHaveProperty('churchesByPlan')
      expect(response.body).toHaveProperty('activeChurches')

      // Verifica tipos
      expect(typeof response.body.totalUsers).toBe('number')
      expect(typeof response.body.totalChurches).toBe('number')
      expect(Array.isArray(response.body.churchesByPlan)).toBe(true)
    })

    it('deve negar acesso sem autenticação', async () => {
      const response = await request(app.server).get('/admin/dashboard/stats')

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })
  })

  describe('ADM_API_DASHBOARD_TS001_TC002: Dashboard com dados - valida totais', () => {
    it('deve retornar métricas corretas quando há dados no banco', async () => {
      // Given: Cria dados de teste
      const plan = await createTestPlan({
        name: 'Test Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const user = await createTestUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@test.com',
        password: 'password123',
      })

      await createTestSubscription(user.id, plan.id, SubscriptionStatus.active)

      const church = await createTestChurch({
        name: 'Test Church',
      })

      const branch = await createTestBranch({
        name: 'Test Branch',
        churchId: church.id,
      })

      await createTestMember({
        name: 'Test Member',
        email: 'testmember@test.com',
        branchId: branch.id,
      })

      const response = await request(app.server)
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(1)
      expect(response.body.totalChurches).toBeGreaterThanOrEqual(1)
      expect(response.body.totalBranches).toBeGreaterThanOrEqual(1)
      expect(response.body.totalMembers).toBeGreaterThanOrEqual(1)
    })
  })

  describe('ADM_API_DASHBOARD_TS001_TC003: Dashboard sem dados - estado inicial', () => {
    it('deve retornar zeros quando não há dados', async () => {
      await resetTestDatabase()

      // Recria admin e token
      const fixtures = await createAdminUsersFixtures()
      const authResult = await loginAdmin(app, {
        email: 'superadmin@test.com',
        password: 'password123',
      })

      const response = await request(app.server)
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authResult.token}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.totalUsers).toBe(0)
      expect(response.body.totalChurches).toBe(0)
      expect(response.body.totalBranches).toBe(0)
      expect(response.body.totalMembers).toBe(0)
      expect(response.body.newUsersLast7Days).toBe(0)
      expect(response.body.newUsersLast30Days).toBe(0)
      expect(response.body.newChurchesLast7Days).toBe(0)
      expect(response.body.newChurchesLast30Days).toBe(0)
      expect(response.body.churchesByPlan).toEqual([])
    })
  })
})

