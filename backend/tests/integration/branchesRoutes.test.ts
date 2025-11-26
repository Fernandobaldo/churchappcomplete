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
      await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 5, // Permitir múltiplas branches para testes
        },
      })

    // Criar igreja
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
      },
    })
    adminChurchId = church.id

    // Criar filial principal
    const mainBranch = await prisma.branch.create({
      data: {
        name: 'Filial Principal',
        churchId: church.id,
        isMainBranch: true,
      },
    })
    adminBranchId = mainBranch.id

    // Criar usuário ADMINGERAL
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        Subscription: {
          create: {
            planId: plan.id,
            status: 'active',
          },
        },
      },
    })

    const adminMember = await prisma.member.create({
      data: {
        name: 'Admin Member',
        email: 'adminmember@example.com',
        branchId: mainBranch.id,
        role: 'ADMINGERAL',
        userId: adminUser.id,
      },
      include: { Permission: true },
    })
    adminMemberId = adminMember.id

    adminToken = app.jwt.sign({
      sub: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      type: 'user',
      memberId: adminMember.id,
      role: adminMember.role,
      branchId: adminMember.branchId,
      churchId: church.id,
      permissions: adminMember.Permission.map(p => p.type),
    })

    // Criar usuário COORDINATOR (sem permissão para criar branches)
    const coordinatorUser = await prisma.user.create({
      data: {
        name: 'Coordinator User',
        email: 'coordinator@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })

    const coordinatorMember = await prisma.member.create({
      data: {
        name: 'Coordinator Member',
        email: 'coordinatormember@example.com',
        branchId: mainBranch.id,
        role: 'COORDINATOR',
        userId: coordinatorUser.id,
      },
      include: { Permission: true },
    })

    coordinatorToken = app.jwt.sign({
      sub: coordinatorUser.id,
      email: coordinatorUser.email,
      name: coordinatorUser.name,
      type: 'user',
      memberId: coordinatorMember.id,
      role: coordinatorMember.role,
      branchId: coordinatorMember.branchId,
      churchId: church.id,
      permissions: coordinatorMember.Permission.map(p => p.type),
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

      expect(response.status).toBe(400)
    })

    it('deve retornar 403 quando limite de branches é excedido', async () => {
      // Criar plano com limite de 1 branch
      const limitedPlan = await prisma.plan.create({
        data: {
          name: 'Limited Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })

      const limitedChurch = await prisma.church.create({
        data: {
          name: 'Igreja Limitada',
        },
      })

      // Criar branch principal
      await prisma.branch.create({
        data: {
          name: 'Filial Principal Limitada',
          churchId: limitedChurch.id,
          isMainBranch: true,
        },
      })

      // Criar admin para esta igreja
      const limitedAdminUser = await prisma.user.create({
        data: {
          name: 'Limited Admin',
          email: 'limited@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const limitedAdminMember = await prisma.member.create({
        data: {
          name: 'Limited Admin Member',
          email: 'limitedmember@example.com',
          branchId: adminBranchId, // Usar branch existente temporariamente
          role: 'ADMINGERAL',
          userId: limitedAdminUser.id,
        },
        include: { Permission: true },
      })

      const limitedToken = app.jwt.sign({
        sub: limitedAdminUser.id,
        email: limitedAdminUser.email,
        name: limitedAdminUser.name,
        type: 'user',
        memberId: limitedAdminMember.id,
        role: limitedAdminMember.role,
        branchId: limitedAdminMember.branchId,
        churchId: limitedChurch.id,
        permissions: limitedAdminMember.Permission.map(p => p.type),
      })

      const branchData = {
        name: 'Filial Extra',
        churchId: limitedChurch.id,
      }

      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send(branchData)

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /branches/:id', () => {
    it('deve deletar branch com sucesso', async () => {
      // Criar branch para deletar
      const branchToDelete = await prisma.branch.create({
        data: {
          name: 'Filial para Deletar',
          churchId: adminChurchId,
          isMainBranch: false,
        },
      })

      const response = await request(app.server)
        .delete(`/branches/${branchToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

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

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('deve retornar 404 quando branch não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .delete(`/branches/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 quando COORDINATOR tenta deletar', async () => {
      const branchToDelete = await prisma.branch.create({
        data: {
          name: 'Filial para Teste',
          churchId: adminChurchId,
          isMainBranch: false,
        },
      })

      const response = await request(app.server)
        .delete(`/branches/${branchToDelete.id}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)

      expect(response.status).toBe(403)
    })
  })
})

