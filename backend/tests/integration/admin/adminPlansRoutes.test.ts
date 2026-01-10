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
import { createTestPlan } from '../../utils/testFactories'

describe('Admin Plans Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let support: any
  let superadminToken: string
  let supportToken: string

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
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_PLANS_TS001_TC001: GET /admin/plans - listar planos', () => {
    it('deve listar todos os planos', async () => {
      const response = await request(app.server)
        .get('/admin/plans')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('plans')
      expect(response.body).toHaveProperty('availableFeatures')
      expect(Array.isArray(response.body.plans)).toBe(true)
    })
  })

  describe('ADM_API_PLANS_TS001_TC002: GET /admin/plans/:id - detalhes do plano', () => {
    it('deve retornar detalhes do plano', async () => {
      // Given: Plano criado
      const plan = await createTestPlan({
        name: 'Test Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const response = await request(app.server)
        .get(`/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('name')
      expect(response.body).toHaveProperty('price')
    })
  })

  describe('ADM_API_PLANS_TS001_TC003: POST /admin/plans - criar plano (SUPERADMIN)', () => {
    it('deve criar plano quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .post('/admin/plans')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'New Plan',
          price: 99.99,
          features: ['events', 'members', 'finances', 'advanced_reports'],
          maxMembers: 100,
          maxBranches: 5,
        })

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.name).toBe('New Plan')

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'ADMIN_CONFIG_UPDATED',
          entityType: 'Plan',
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(auditLog).toBeDefined()
    })
  })

  describe('ADM_API_PLANS_TS001_TC004: PATCH /admin/plans/:id - editar plano (SUPERADMIN)', () => {
    it('deve editar plano quando SUPERADMIN', async () => {
      // Given: Plano criado
      const plan = await createTestPlan({
        name: `Plan to Edit ${Date.now()}-1`,
        price: 0,
        features: ['events'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Edited Plan',
          price: 49.99,
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Edited Plan')
    })

    it('deve editar plano com features válidas', async () => {
      // Given: Plano criado
      const plan = await createTestPlan({
        name: `Plan with Features ${Date.now()}-2`,
        price: 0,
        features: ['events'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Updated Plan',
          features: ['events', 'members', 'finances'],
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.features).toEqual(['events', 'members', 'finances'])
    })

    it('deve rejeitar features inválidas', async () => {
      // Given: Plano criado
      const plan = await createTestPlan({
        name: `Plan Invalid Features ${Date.now()}-3`,
        price: 0,
        features: ['events'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Edited Plan',
          features: ['invalid_feature', 'another_invalid'],
        })

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Features inválidas')
    })

    it('deve aceitar array vazio de features', async () => {
      // Given: Plano criado
      const plan = await createTestPlan({
        name: `Plan Empty Features ${Date.now()}-4`,
        price: 0,
        features: ['events'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: `Edited Plan ${Date.now()}`,
          features: [],
        })

      logTestResponse(response, response.status)
      if (response.status !== 200) {
        console.error('Response body:', JSON.stringify(response.body, null, 2))
      }
      expect(response.status).toBe(200)
      expect(response.body.features).toEqual([])
    })

    it('deve editar todos os campos do plano', async () => {
      // Given: Plano criado
      const plan = await createTestPlan({
        name: `Plan Full Edit ${Date.now()}-5`,
        price: 0,
        features: ['events'],
        maxMembers: 10,
        maxBranches: 1,
        isActive: true,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Fully Edited Plan',
          price: 99.99,
          features: ['events', 'members', 'finances', 'advanced_reports'],
          maxMembers: 500,
          maxBranches: 10,
          isActive: false,
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Fully Edited Plan')
      expect(response.body.price).toBe(99.99)
      expect(response.body.maxMembers).toBe(500)
      expect(response.body.maxBranches).toBe(10)
      expect(response.body.isActive).toBe(false)
    })
  })

  describe('ADM_API_PLANS_TS001_TC005: PATCH /admin/plans/:id/activate - ativar (SUPERADMIN)', () => {
    it('deve ativar plano quando SUPERADMIN', async () => {
      // Given: Plano inativo criado
      const plan = await createTestPlan({
        name: 'Inactive Plan',
        price: 0,
        features: ['basic'],
        isActive: false,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}/activate`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      const activatedPlan = await prisma.plan.findUnique({
        where: { id: plan.id },
      })
      expect(activatedPlan?.isActive).toBe(true)
    })
  })

  describe('ADM_API_PLANS_TS001_TC006: PATCH /admin/plans/:id/deactivate - desativar (SUPERADMIN)', () => {
    it('deve desativar plano quando SUPERADMIN', async () => {
      // Given: Plano ativo criado
      const plan = await createTestPlan({
        name: 'Active Plan',
        price: 0,
        features: ['basic'],
        isActive: true,
      })

      const response = await request(app.server)
        .patch(`/admin/plans/${plan.id}/deactivate`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      const deactivatedPlan = await prisma.plan.findUnique({
        where: { id: plan.id },
      })
      expect(deactivatedPlan?.isActive).toBe(false)
    })
  })

  describe('ADM_API_PLANS_TS001_TC007: Criar plano - SUPPORT não pode', () => {
    it('deve negar acesso quando SUPPORT tenta criar plano', async () => {
      const response = await request(app.server)
        .post('/admin/plans')
        .set('Authorization', `Bearer ${supportToken}`)
        .send({
          name: 'Support Plan',
          price: 0,
          features: ['basic'],
        })

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })
})

