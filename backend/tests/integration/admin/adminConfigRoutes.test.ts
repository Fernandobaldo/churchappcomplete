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

describe('Admin Config Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let support: any
  let finance: any
  let superadminToken: string
  let supportToken: string
  let financeToken: string

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
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_CONFIG_TS001_TC001: GET /admin/config - ver configurações (SUPERADMIN)', () => {
    it('deve retornar configurações quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .get('/admin/config')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('trialDuration')
      expect(response.body).toHaveProperty('defaultPlan')
    })
  })

  describe('ADM_API_CONFIG_TS001_TC002: PATCH /admin/config - atualizar (SUPERADMIN)', () => {
    it('deve atualizar configurações quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .patch('/admin/config')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          trialDuration: 60,
          defaultPlan: 'premium',
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'ADMIN_CONFIG_UPDATED',
          entityType: 'SystemConfig',
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(auditLog).toBeDefined()
    })
  })

  describe('ADM_API_CONFIG_TS001_TC003: Acessar config - SUPPORT não pode', () => {
    it('deve negar acesso quando SUPPORT tenta acessar config', async () => {
      const response = await request(app.server)
        .get('/admin/config')
        .set('Authorization', `Bearer ${supportToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('ADM_API_CONFIG_TS001_TC004: Acessar config - FINANCE não pode', () => {
    it('deve negar acesso quando FINANCE tenta acessar config', async () => {
      const response = await request(app.server)
        .get('/admin/config')
        .set('Authorization', `Bearer ${financeToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })
})

