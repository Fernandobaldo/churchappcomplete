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

describe('Admin Users Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let support: any
  let finance: any
  let superadminToken: string
  let supportToken: string
  let financeToken: string
  let testUser: any
  let testPlan: any

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
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_USERS_TS001_TC001: GET /admin/users - listar com paginação', () => {
    it('deve listar usuários com paginação', async () => {
      const response = await request(app.server)
        .get('/admin/users')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('users')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('limit')
      expect(response.body.pagination).toHaveProperty('total')
      expect(response.body.pagination).toHaveProperty('totalPages')
      expect(Array.isArray(response.body.users)).toBe(true)
    })

    it('deve negar acesso sem autenticação', async () => {
      const response = await request(app.server).get('/admin/users')

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })
  })

  describe('ADM_API_USERS_TS001_TC002: GET /admin/users?search=email - buscar por email', () => {
    it('deve filtrar usuários por email', async () => {
      const response = await request(app.server)
        .get('/admin/users')
        .query({ search: 'testuser@test.com' })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.users.length).toBeGreaterThan(0)
      expect(response.body.users[0].email).toContain('testuser@test.com')
    })
  })

  describe('ADM_API_USERS_TS001_TC003: GET /admin/users/:id - detalhes do usuário', () => {
    it('deve retornar detalhes completos do usuário', async () => {
      const response = await request(app.server)
        .get(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('email')
      expect(response.body).toHaveProperty('name')
      expect(response.body).toHaveProperty('churchesAsOwner')
      expect(response.body).toHaveProperty('churchesAsMember')
      expect(response.body).toHaveProperty('subscription')
      expect(response.body).toHaveProperty('member')
    })

    it('deve retornar 404 quando usuário não existe', async () => {
      const response = await request(app.server)
        .get('/admin/users/nonexistent-id')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
    })
  })

  describe('ADM_API_USERS_TS001_TC004: PATCH /admin/users/:id/block - bloquear (SUPERADMIN)', () => {
    it('deve bloquear usuário quando SUPERADMIN', async () => {
      const userToBlock = await prisma.user.create({
        data: {
          name: 'User to Block',
          email: 'usertoblock@test.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const response = await request(app.server)
        .patch(`/admin/users/${userToBlock.id}/block`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')

      // Verifica se foi bloqueado
      const blockedUser = await prisma.user.findUnique({
        where: { id: userToBlock.id },
      })
      expect(blockedUser?.isBlocked).toBe(true)

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'USER_BLOCKED',
          entityId: userToBlock.id,
        },
      })
      expect(auditLog).toBeDefined()
    })
  })

  describe('ADM_API_USERS_TS001_TC005: PATCH /admin/users/:id/unblock - desbloquear (SUPERADMIN)', () => {
    it('deve desbloquear usuário quando SUPERADMIN', async () => {
      const userToUnblock = await prisma.user.create({
        data: {
          name: 'User to Unblock',
          email: 'usertounblock@test.com',
          password: await bcrypt.hash('password123', 10),
          isBlocked: true,
        },
      })

      const response = await request(app.server)
        .patch(`/admin/users/${userToUnblock.id}/unblock`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verifica se foi desbloqueado
      const unblockedUser = await prisma.user.findUnique({
        where: { id: userToUnblock.id },
      })
      expect(unblockedUser?.isBlocked).toBe(false)
    })
  })

  describe('ADM_API_USERS_TS001_TC006: POST /admin/users/:id/reset-password - reset senha', () => {
    it('deve enviar reset de senha quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .post(`/admin/users/${testUser.id}/reset-password`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'PASSWORD_RESET_SENT',
          entityId: testUser.id,
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(auditLog).toBeDefined()
    })
  })

  describe('ADM_API_USERS_TS001_TC007: POST /admin/users/:id/impersonate - impersonar', () => {
    it('deve gerar token de impersonação quando SUPERADMIN', async () => {
      const response = await request(app.server)
        .post(`/admin/users/${testUser.id}/impersonate`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('expiresIn')

      // Verifica se foi registrado no AuditLog
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'IMPERSONATE_USER',
          entityId: testUser.id,
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(auditLog).toBeDefined()
    })
  })

  describe('ADM_API_USERS_TS001_TC008: Bloquear usuário - SUPPORT não pode', () => {
    it('deve negar acesso quando SUPPORT tenta bloquear', async () => {
      const userToBlock = await prisma.user.create({
        data: {
          name: 'User for Support Test',
          email: 'userforsupport@test.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const response = await request(app.server)
        .patch(`/admin/users/${userToBlock.id}/block`)
        .set('Authorization', `Bearer ${supportToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('ADM_API_USERS_TS001_TC009: Listar usuários - FINANCE não pode', () => {
    it('deve negar acesso quando FINANCE tenta listar usuários', async () => {
      const response = await request(app.server)
        .get('/admin/users')
        .set('Authorization', `Bearer ${financeToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })
})

