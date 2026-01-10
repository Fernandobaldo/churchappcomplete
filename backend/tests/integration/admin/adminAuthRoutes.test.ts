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
import { createTestUser } from '../../utils/testFactories'
import {
  createAdminUser,
  createAdminUsersFixtures,
  generateAdminToken,
  generateExpiredAdminToken,
  cleanupAdminUsers,
  loginAdmin,
} from '../../utils/adminTestHelpers'
import { AdminRole } from '@prisma/client'
import { prisma } from '../../../src/lib/prisma'
import { logTestResponse } from '../../utils/testResponseHelper'
import jwt from 'jsonwebtoken'

describe('Admin Auth Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let support: any
  let finance: any
  let regularUser: any

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

    // Cria um usuário comum (não admin) para testar negação de acesso
    regularUser = await createTestUser({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@test.com',
      password: 'password123',
    })
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_AUTH_TS001_TC001: Login admin válido (SUPERADMIN)', () => {
    it('deve fazer login com credenciais válidas e retornar token', async () => {
      const response = await request(app.server)
        .post('/admin/auth/login')
        .send({
          email: 'superadmin@test.com',
          password: 'password123',
        })

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('admin')
      expect(response.body.admin.email).toBe('superadmin@test.com')
      expect(response.body.admin.adminRole).toBe(AdminRole.SUPERADMIN)
      expect(response.body.admin).not.toHaveProperty('passwordHash')

      // Verifica se o token é válido
      const decoded = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET || 'churchapp-secret-key'
      ) as any
      expect(decoded.type).toBe('admin')
      expect(decoded.adminRole).toBe(AdminRole.SUPERADMIN)
    })
  })

  describe('ADM_API_AUTH_TS001_TC002: Login com credenciais incorretas - email inexistente', () => {
    it('deve retornar erro 401 quando email não existe', async () => {
      const response = await request(app.server)
        .post('/admin/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Email não encontrado')
    })
  })

  describe('ADM_API_AUTH_TS001_TC003: Login com senha errada', () => {
    it('deve retornar erro 401 quando senha está incorreta', async () => {
      const response = await request(app.server)
        .post('/admin/auth/login')
        .send({
          email: 'superadmin@test.com',
          password: 'wrongpassword',
        })

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Senha incorreta')
    })
  })

  describe('ADM_API_AUTH_TS001_TC004: Login de usuário comum (não admin)', () => {
    it('deve negar acesso quando tenta logar com User normal', async () => {
      const response = await request(app.server)
        .post('/admin/auth/login')
        .send({
          email: 'regular@test.com',
          password: 'password123',
        })

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('ADM_API_AUTH_TS001_TC005: Login com admin inativo', () => {
    it('deve negar acesso quando admin está inativo', async () => {
      const inactiveAdmin = await createAdminUser({
        name: 'Inactive Admin',
        email: 'inactive@test.com',
        password: 'password123',
        adminRole: AdminRole.SUPPORT,
        isActive: false,
      })

      const response = await request(app.server)
        .post('/admin/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'password123',
        })

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('inativa')

      // Limpa o admin inativo
      await prisma.adminUser.delete({ where: { id: inactiveAdmin.id } })
    })
  })

  describe('ADM_API_AUTH_TS001_TC006: Token inválido - acesso negado', () => {
    it('deve negar acesso quando token é inválido', async () => {
      const response = await request(app.server)
        .get('/admin/auth/me')
        .set('Authorization', 'Bearer invalid-token')

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
    })

    it('deve negar acesso quando token não é de admin', async () => {
      // Cria um token de usuário comum (não admin)
      const userToken = app.jwt.sign({
        sub: regularUser.id,
        email: regularUser.email,
        name: regularUser.name,
        type: 'user',
      })

      const response = await request(app.server)
        .get('/admin/auth/me')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Token inválido para acesso de admin')
    })
  })

  describe('ADM_API_AUTH_TS001_TC007: Token expirado - tratamento de sessão', () => {
    it('deve negar acesso quando token está expirado', async () => {
      const expiredToken = generateExpiredAdminToken(superadmin)

      const response = await request(app.server)
        .get('/admin/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('expirado')
    })
  })

  describe('ADM_API_AUTH_TS001_TC008: GET /admin/auth/me - retorna dados do admin', () => {
    it('deve retornar dados do admin autenticado', async () => {
      const authResult = await loginAdmin(app, {
        email: 'superadmin@test.com',
        password: 'password123',
      })

      const response = await request(app.server)
        .get('/admin/auth/me')
        .set('Authorization', `Bearer ${authResult.token}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('admin')
      expect(response.body.admin.email).toBe('superadmin@test.com')
      expect(response.body.admin.adminRole).toBe(AdminRole.SUPERADMIN)
      expect(response.body.admin).not.toHaveProperty('passwordHash')
    })

    it('deve negar acesso quando não há token', async () => {
      const response = await request(app.server).get('/admin/auth/me')

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /admin/auth/logout', () => {
    it('deve registrar logout no AuditLog', async () => {
      const authResult = await loginAdmin(app, {
        email: 'superadmin@test.com',
        password: 'password123',
      })

      const response = await request(app.server)
        .post('/admin/auth/logout')
        .set('Authorization', `Bearer ${authResult.token}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')

      // Verifica se o log foi criado
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'ADMIN_LOGOUT',
          adminUserId: superadmin.id,
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.userEmail).toBe('superadmin@test.com')
    })
  })
})

