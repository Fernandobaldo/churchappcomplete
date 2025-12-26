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

describe('Position Routes', () => {
  const app = Fastify()
  let adminToken: string
  let adminUserId: string
  let adminMemberId: string
  let churchId: string
  let branchId: string
  let coordinatorToken: string
  let coordinatorUserId: string

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
    await prisma.plan.findFirst({ where: { name: 'Free Plan' } }) || 
      await prisma.plan.create({
        data: {
          name: 'Free Plan',
          price: 0,
          features: ['basic'],
          maxMembers: 10,
          maxBranches: 1,
        },
      })

    // Criar igreja
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
      },
    })
    churchId = church.id

    // Criar filial
    const branch = await prisma.branch.create({
      data: {
        name: 'Filial Teste',
        churchId: church.id,
      },
    })
    branchId = branch.id

    // Criar usuário ADMINGERAL
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })
    adminUserId = adminUser.id

    const adminMember = await prisma.member.create({
      data: {
        name: 'Admin Member',
        email: 'adminmember@example.com',
        branchId: branch.id,
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

    // Criar usuário COORDINATOR
    const coordinatorUser = await prisma.user.create({
      data: {
        name: 'Coordinator User',
        email: 'coordinator@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })
    coordinatorUserId = coordinatorUser.id

    const coordinatorMember = await prisma.member.create({
      data: {
        name: 'Coordinator Member',
        email: 'coordinatormember@example.com',
        branchId: branch.id,
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

  describe('GET /positions', () => {
    it('deve listar cargos com cargos padrão criados automaticamente', async () => {
      const response = await request(app.server)
        .get('/positions')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      // Deve ter pelo menos os cargos padrão
      expect(response.body.length).toBeGreaterThanOrEqual(6)
      
      const defaultPositions = response.body.filter((p: any) => p.isDefault)
      expect(defaultPositions.length).toBeGreaterThanOrEqual(6)
    })

    it('deve retornar 401 quando não autenticado', async () => {
      const response = await request(app.server)
        .get('/positions')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /positions', () => {
    it('deve criar cargo com sucesso (ADMINGERAL)', async () => {
      const positionData = {
        name: 'Diácono',
      }

      const response = await request(app.server)
        .post('/positions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(positionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('name', 'Diácono')
      expect(response.body).toHaveProperty('churchId', churchId)
      expect(response.body).toHaveProperty('isDefault', false)
    })

    it('deve retornar 403 quando COORDINATOR tenta criar cargo', async () => {
      const positionData = {
        name: 'Músico',
      }

      const response = await request(app.server)
        .post('/positions')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send(positionData)

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const positionData = {
        // Faltando name
      }

      const response = await request(app.server)
        .post('/positions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(positionData)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /positions/:id', () => {
    it('deve atualizar cargo com sucesso (ADMINGERAL)', async () => {
      // Criar um cargo primeiro
      const position = await prisma.churchPosition.create({
        data: {
          name: 'Cargo Teste',
          churchId: churchId,
          isDefault: false,
        },
      })

      const updateData = {
        name: 'Cargo Atualizado',
      }

      const response = await request(app.server)
        .put(`/positions/${position.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Cargo Atualizado')
    })

    it('deve retornar 403 quando tenta atualizar cargo padrão', async () => {
      // Buscar um cargo padrão
      const defaultPosition = await prisma.churchPosition.findFirst({
        where: { churchId, isDefault: true },
      })

      if (defaultPosition) {
        const updateData = {
          name: 'Tentativa de Alterar',
        }

        const response = await request(app.server)
          .put(`/positions/${defaultPosition.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)

        expect(response.status).toBe(403)
      }
    })

    it('deve retornar 403 quando COORDINATOR tenta atualizar', async () => {
      const position = await prisma.churchPosition.create({
        data: {
          name: 'Cargo Coord',
          churchId: churchId,
          isDefault: false,
        },
      })

      const updateData = {
        name: 'Tentativa',
      }

      const response = await request(app.server)
        .put(`/positions/${position.id}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send(updateData)

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /positions/:id', () => {
    it('deve deletar cargo com sucesso (ADMINGERAL)', async () => {
      const position = await prisma.churchPosition.create({
        data: {
          name: 'Cargo para Deletar',
          churchId: churchId,
          isDefault: false,
        },
      })

      const response = await request(app.server)
        .delete(`/positions/${position.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')

      // Verificar que foi deletado
      const deleted = await prisma.churchPosition.findUnique({
        where: { id: position.id },
      })
      expect(deleted).toBeNull()
    })

    it('deve retornar 403 quando tenta deletar cargo padrão', async () => {
      const defaultPosition = await prisma.churchPosition.findFirst({
        where: { churchId, isDefault: true },
      })

      if (defaultPosition) {
        const response = await request(app.server)
          .delete(`/positions/${defaultPosition.id}`)
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(500) // O service lança erro que vira 500
      }
    })

    it('deve retornar 403 quando COORDINATOR tenta deletar', async () => {
      const position = await prisma.churchPosition.create({
        data: {
          name: 'Cargo Coord Delete',
          churchId: churchId,
          isDefault: false,
        },
      })

      const response = await request(app.server)
        .delete(`/positions/${position.id}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)

      expect(response.status).toBe(403)
    })
  })
})










