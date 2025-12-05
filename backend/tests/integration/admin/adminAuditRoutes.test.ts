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

describe('Admin Audit Routes - Integration Tests', () => {
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

    // Faz login para obter tokens e criar logs
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

    // Cria alguns logs de auditoria para teste
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_LOGIN',
        entityType: 'AdminUser',
        entityId: superadmin.id,
        userId: superadmin.id,
        userEmail: superadmin.email,
        userRole: superadmin.adminRole,
        description: 'Admin fez login',
        adminUserId: superadmin.id,
      },
    })
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_AUDIT_TS001_TC001: GET /admin/audit - listar logs (SUPERADMIN)', () => {
    it('deve listar logs de auditoria quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .get('/admin/audit')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('logs')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.logs)).toBe(true)
    })
  })

  describe('ADM_API_AUDIT_TS001_TC002: GET /admin/audit?adminUserId=xxx - filtrar por admin', () => {
    it('deve filtrar logs por admin', async () => {
      const response = await request(app.server)
        .get('/admin/audit')
        .query({ adminUserId: superadmin.id })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.logs.length).toBeGreaterThan(0)
    })
  })

  describe('ADM_API_AUDIT_TS001_TC003: GET /admin/audit?action=CHURCH_SUSPENDED - filtrar por ação', () => {
    it('deve filtrar logs por ação', async () => {
      const response = await request(app.server)
        .get('/admin/audit')
        .query({ action: 'ADMIN_LOGIN' })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.logs.every((log: any) => log.action === 'ADMIN_LOGIN')).toBe(true)
    })
  })

  describe('ADM_API_AUDIT_TS001_TC004: Acessar audit - SUPPORT não pode', () => {
    it('deve negar acesso quando SUPPORT tenta acessar audit', async () => {
      const response = await request(app.server)
        .get('/admin/audit')
        .set('Authorization', `Bearer ${supportToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })
})

