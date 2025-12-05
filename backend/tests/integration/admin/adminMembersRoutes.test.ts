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
import { prisma } from '../../../src/lib/prisma'
import { logTestResponse } from '../../utils/testResponseHelper'

describe('Admin Members Routes - Integration Tests', () => {
  const app = Fastify()
  let superadmin: any
  let superadminToken: string
  let testChurch: any
  let testBranch: any
  let testMember: any

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
    const superadminAuth = await loginAdmin(app, {
      email: 'superadmin@test.com',
      password: 'password123',
    })
    superadminToken = superadminAuth.token

    // Cria igreja, branch e membro de teste
    testChurch = await prisma.church.create({
      data: {
        name: 'Test Church',
        isActive: true,
      },
    })

    testBranch = await prisma.branch.create({
      data: {
        name: 'Test Branch',
        churchId: testChurch.id,
        isMainBranch: true,
      },
    })

    testMember = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'testmember@test.com',
        role: 'MEMBER',
        branchId: testBranch.id,
      },
    })
  })

  afterAll(async () => {
    await cleanupAdminUsers()
    await resetTestDatabase()
    await app.close()
  })

  describe('ADM_API_MEMBERS_TS001_TC001: GET /admin/members - listar membros', () => {
    it('deve listar membros com paginação', async () => {
      const response = await request(app.server)
        .get('/admin/members')
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('members')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.members)).toBe(true)
    })
  })

  describe('ADM_API_MEMBERS_TS001_TC002: GET /admin/members?email=test@example.com - filtrar por email', () => {
    it('deve filtrar membros por email', async () => {
      const response = await request(app.server)
        .get('/admin/members')
        .query({ search: 'testmember@test.com' })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.members.length).toBeGreaterThan(0)
      expect(response.body.members[0].email).toContain('testmember@test.com')
    })
  })

  describe('ADM_API_MEMBERS_TS001_TC003: GET /admin/members?churchId=xxx - filtrar por igreja', () => {
    it('deve filtrar membros por igreja', async () => {
      const response = await request(app.server)
        .get('/admin/members')
        .query({ search: 'Test Church' })
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body.members.length).toBeGreaterThan(0)
    })
  })

  describe('ADM_API_MEMBERS_TS001_TC004: GET /admin/members/:id - detalhes do membro', () => {
    it('deve retornar detalhes completos do membro', async () => {
      const response = await request(app.server)
        .get(`/admin/members/${testMember.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('email')
      expect(response.body).toHaveProperty('name')
      expect(response.body).toHaveProperty('church')
      expect(response.body).toHaveProperty('branch')
    })
  })
})

