import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { registerRoutes } from '../../src/routes/registerRoutes'
import { authenticate } from '../../src/middlewares/authenticate'
import { logTestResponse } from '../utils/testResponseHelper'
import { 
  createTestUser,
  createTestPlan,
  createTestSubscription,
  createTestChurch,
  createTestBranch,
  createTestMember,
} from '../utils/testFactories'
import { SubscriptionStatus } from '@prisma/client'

describe('Branches Routes - CRUD Completo', () => {
  const app = Fastify()
  let adminToken: string
  let adminMemberId: string
  let adminBranchId: string
  let adminChurchId: string
  let coordinatorToken: string

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'churchapp-secret-key'
    }

    app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'churchapp-secret-key',
    })

    app.decorate('authenticate', authenticate)

    await registerRoutes(app)
    await app.ready()

    await resetTestDatabase()

    // Criar plano
    const plan = await prisma.plan.findFirst({ where: { name: 'Free Plan' } }) || 
      await createTestPlan({
        name: 'Free Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 5, // Permitir múltiplas branches para testes
      })

    // Criar igreja
    const church = await createTestChurch({
      name: 'Igreja Teste',
    })
    adminChurchId = church.id

    // Criar filial principal
    const mainBranch = await createTestBranch({
      name: 'Filial Principal',
      churchId: church.id,
      isMainBranch: true,
    })
    adminBranchId = mainBranch.id

    // Criar usuário ADMINGERAL
    const adminUser = await createTestUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
    })
    
    await createTestSubscription(adminUser.id, plan.id, SubscriptionStatus.active)

    const adminMember = await createTestMember({
      name: 'Admin Member',
      email: 'adminmember@example.com',
      branchId: mainBranch.id,
      role: 'ADMINGERAL',
      userId: adminUser.id,
    })

    // Buscar adminMember com Permission incluída
    const adminMemberWithPermission = await prisma.member.findUnique({
      where: { id: adminMember.id },
      include: { Permission: true },
    })
    adminMemberId = adminMemberWithPermission!.id

    const adminFullName = `${adminUser.firstName} ${adminUser.lastName}`.trim()
    adminToken = app.jwt.sign({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminFullName,
      type: 'user',
      memberId: adminMemberWithPermission!.id,
      role: adminMemberWithPermission!.role,
      branchId: adminMemberWithPermission!.branchId,
      churchId: church.id,
      permissions: adminMemberWithPermission!.Permission.map(p => p.type),
    })

    // Criar usuário COORDINATOR (sem permissão para criar branches)
    const coordinatorUser = await createTestUser({
      firstName: 'Coordinator',
      lastName: 'User',
      email: 'coordinator@example.com',
      password: 'password123',
    })

    const coordinatorMember = await createTestMember({
      name: 'Coordinator Member',
      email: 'coordinatormember@example.com',
      branchId: mainBranch.id,
      role: 'COORDINATOR',
      userId: coordinatorUser.id,
    })

    // Buscar coordinatorMember com Permission incluída
    const coordinatorMemberWithPermission = await prisma.member.findUnique({
      where: { id: coordinatorMember.id },
      include: { Permission: true },
    })

    const coordinatorFullName = `${coordinatorUser.firstName} ${coordinatorUser.lastName}`.trim()
    coordinatorToken = app.jwt.sign({
      sub: coordinatorUser.id,
      email: coordinatorUser.email,
      name: coordinatorFullName,
      type: 'user',
      memberId: coordinatorMemberWithPermission!.id,
      role: coordinatorMemberWithPermission!.role,
      branchId: coordinatorMemberWithPermission!.branchId,
      churchId: church.id,
      permissions: coordinatorMemberWithPermission!.Permission.map(p => p.type),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /branches', () => {
    it('deve retornar lista de branches', async () => {
      const response = await request(app.server)
        .get('/branches')
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('name')
      expect(response.body[0]).toHaveProperty('churchId')
    })

    it('deve retornar 401 quando não autenticado', async () => {
      const response = await request(app.server)
        .get('/branches')

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /branches', () => {
    it('ADMINGERAL deve criar branch com sucesso', async () => {
      const branchData = {
        name: 'Nova Filial',
        churchId: adminChurchId,
      }

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(branchData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('name', 'Nova Filial')
      expect(response.body).toHaveProperty('churchId', adminChurchId)
      expect(response.body).toHaveProperty('isMainBranch', false)
    })

    it('deve retornar 403 quando COORDINATOR tenta criar branch', async () => {
      const branchData = {
        name: 'Filial Não Autorizada',
        churchId: adminChurchId,
      }

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send(branchData)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const branchData = {
        // Faltando churchId
        name: 'Filial Sem Igreja',
      }

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(branchData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
    })

    it('deve retornar 403 quando limite de branches é excedido', async () => {
      // Criar plano com limite de 1 branch
      const limitedPlan = await createTestPlan({
        name: 'Limited Plan',
        price: 0,
        features: ['basic'],
        maxMembers: 10,
        maxBranches: 1,
      })

      const limitedChurch = await createTestChurch({
        name: 'Igreja Limitada',
      })

      // Criar branch principal
      const limitedMainBranch = await createTestBranch({
        name: 'Filial Principal Limitada',
        churchId: limitedChurch.id,
        isMainBranch: true,
      })

      // Criar admin para esta igreja
      const limitedAdminUser = await createTestUser({
        firstName: 'Limited',
        lastName: 'Admin',
        email: 'limited@example.com',
        password: 'password123',
      })

      // Criar subscription para o usuário com o plano limitado
      await createTestSubscription(limitedAdminUser.id, limitedPlan.id, SubscriptionStatus.active)

      const limitedAdminMember = await createTestMember({
        name: 'Limited Admin Member',
        email: 'limitedmember@example.com',
        branchId: limitedMainBranch.id,
        role: 'ADMINGERAL',
        userId: limitedAdminUser.id,
      })

      // Buscar limitedAdminMember com Permission incluída
      const limitedAdminMemberWithPermission = await prisma.member.findUnique({
        where: { id: limitedAdminMember.id },
        include: { Permission: true },
      })

      const limitedFullName = `${limitedAdminUser.firstName} ${limitedAdminUser.lastName}`.trim()
      const limitedToken = app.jwt.sign({
        sub: limitedAdminUser.id,
        email: limitedAdminUser.email,
        name: limitedFullName,
        type: 'user',
        memberId: limitedAdminMemberWithPermission!.id,
        role: limitedAdminMemberWithPermission!.role,
        branchId: limitedAdminMemberWithPermission!.branchId,
        churchId: limitedChurch.id,
        permissions: limitedAdminMemberWithPermission!.Permission.map(p => p.type),
      })

      // Verificar que tudo foi criado corretamente antes de fazer a requisição
      // Garantir que o usuário tem Member com Branch e Subscription ativa
      const verifyUser = await prisma.user.findUnique({
        where: { id: limitedAdminUser.id },
        include: {
          Member: {
            include: {
              Branch: true,
            },
          },
          Subscription: {
            where: { status: SubscriptionStatus.active },
            include: { Plan: true },
          },
        },
      })

      if (!verifyUser?.Member?.Branch) {
        throw new Error('Member não foi criado corretamente com Branch')
      }

      if (!verifyUser.Subscription[0]?.Plan) {
        throw new Error('Subscription não foi criada corretamente')
      }

      const branchData = {
        name: 'Filial Extra',
        churchId: limitedChurch.id,
      }

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send(branchData)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
      // Verificar que o erro é sobre limite excedido, não sobre plano/igreja não encontrada
      expect(response.body.error).toContain('Limite do plano')
    })
  })

  describe('DELETE /branches/:id', () => {
    it('deve deletar branch com sucesso', async () => {
      // Criar branch para deletar
      const branchToDelete = await createTestBranch({
        name: 'Filial para Deletar',
        churchId: adminChurchId,
        isMainBranch: false,
      })

      const response = await request(app.server)
        .delete(`/branches/${branchToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')

      // Verificar que foi deletado
      const deletedBranch = await prisma.branch.findUnique({
        where: { id: branchToDelete.id },
      })
      expect(deletedBranch).toBeNull()
    })

    it('deve retornar 400 quando tenta deletar branch principal', async () => {
      const response = await request(app.server)
        .delete(`/branches/${adminBranchId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('deve retornar 404 quando branch não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .delete(`/branches/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
    })

    it('deve retornar 403 quando COORDINATOR tenta deletar', async () => {
      const branchToDelete = await createTestBranch({
        name: 'Filial para Teste',
        churchId: adminChurchId,
        isMainBranch: false,
      })

      const response = await request(app.server)
        .delete(`/branches/${branchToDelete.id}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)

      logTestResponse(response, 403)
      expect(response.status).toBe(403)
    })
  })
})

