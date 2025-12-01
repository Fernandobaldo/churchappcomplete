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

describe('Churches Routes - CRUD Completo', () => {
  const app = Fastify()
  let userToken: string
  let userId: string
  let churchId: string
  let branchId: string

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
          maxBranches: 1,
        },
      })

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })
    userId = user.id

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
        isMainBranch: true,
      },
    })
    branchId = branch.id

    // Criar membro
    const member = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'member@example.com',
        branchId: branch.id,
        role: 'ADMINGERAL',
        userId: user.id,
      },
      include: { Permission: true },
    })

    // Gerar token
    userToken = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      type: 'user',
      memberId: member.id,
      role: member.role,
      branchId: member.branchId,
      churchId: church.id,
      permissions: member.Permission.map(p => p.type),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /churches', () => {
    it('deve criar igreja com sucesso', async () => {
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      const churchData = {
        name: 'Nova Igreja',
      }

      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send(churchData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('church')
      expect(response.body.church).toHaveProperty('id')
      expect(response.body.church).toHaveProperty('name', 'Nova Igreja')
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const churchData = {
        // Faltando name (obrigatório)
      }

      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send(churchData)

      logTestResponse(response, 400)
      expect(response.status).toBe(400)
    })

    it('deve retornar 401 quando não autenticado', async () => {
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      const churchData = {
        name: 'Igreja Não Autenticada',
      }

      const response = await request(app.server)
        .post('/churches')
        .send(churchData)

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /churches', () => {
    it('deve retornar lista de igrejas', async () => {
      const response = await request(app.server)
        .get('/churches')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('name')
    })

    it('deve retornar 401 quando não autenticado', async () => {
      const response = await request(app.server)
        .get('/churches')

      logTestResponse(response, 401)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /churches/:id', () => {
    it('deve retornar igreja por ID', async () => {
      const response = await request(app.server)
        .get(`/churches/${churchId}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', churchId)
      expect(response.body).toHaveProperty('name', 'Igreja Teste')
    })

    it('deve retornar 404 quando igreja não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .get(`/churches/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /churches/:id', () => {
    it('deve atualizar igreja com sucesso', async () => {
      const updateData = {
        name: 'Igreja Atualizada',
      }

      const response = await request(app.server)
        .put(`/churches/${churchId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Igreja Atualizada')
    })

    it('deve retornar 404 quando igreja não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const updateData = {
        name: 'Igreja Não Existente',
      }

      const response = await request(app.server)
        .put(`/churches/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /churches/:id', () => {
    it('deve deletar igreja com sucesso', async () => {
      // Criar uma nova igreja e membro especificamente para este teste
      // para não depender da ordem dos testes (o teste de criação pode ter mudado o membro)
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      // Criar nova igreja para deletar
      const churchToDelete = await prisma.church.create({
        data: {
          name: 'Igreja para Deletar',
        },
      })

      // Criar branch para a nova igreja
      const branchToDelete = await prisma.branch.create({
        data: {
          name: 'Filial para Deletar',
          churchId: churchToDelete.id,
          isMainBranch: true,
        },
      })

      // Atualizar o membro existente para associar à nova igreja
      const existingMember = await prisma.member.findFirst({
        where: { userId: userId },
      })

      if (!existingMember) {
        throw new Error('Membro não encontrado')
      }

      // Atualizar membro para a nova branch
      const memberToDelete = await prisma.member.update({
        where: { id: existingMember.id },
        data: {
          branchId: branchToDelete.id,
          role: 'ADMINGERAL',
        },
        include: { Permission: true },
      })

      // Gerar token para o novo membro
      const deleteToken = app.jwt.sign({
        sub: userId,
        email: 'test@example.com',
        name: 'Test User',
        type: 'user',
        memberId: memberToDelete.id,
        role: memberToDelete.role,
        branchId: memberToDelete.branchId,
        churchId: churchToDelete.id,
        permissions: memberToDelete.Permission.map(p => p.type),
      })

      const response = await request(app.server)
        .delete(`/churches/${churchToDelete.id}`)
        .set('Authorization', `Bearer ${deleteToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)

      // Verificar que foi deletado
      const deletedChurch = await prisma.church.findUnique({
        where: { id: churchToDelete.id },
      })
      expect(deletedChurch).toBeNull()
    })

    it('deve retornar 404 quando igreja não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .delete(`/churches/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /churches/:id/deactivate', () => {
    it('deve desativar igreja com sucesso', async () => {
      // Criar uma nova igreja e atualizar membro especificamente para este teste
      // para não depender da ordem dos testes (o teste de criação pode ter mudado o membro)
      const plan = await prisma.plan.findFirst()
      if (!plan) throw new Error('Plano não encontrado')

      // Criar nova igreja para desativar
      const churchToDeactivate = await prisma.church.create({
        data: {
          name: 'Igreja para Desativar',
        },
      })

      // Criar branch para a nova igreja
      const branchToDeactivate = await prisma.branch.create({
        data: {
          name: 'Filial para Desativar',
          churchId: churchToDeactivate.id,
          isMainBranch: true,
        },
      })

      // Buscar ou criar membro para este teste
      // Se o teste de delete rodou antes, o membro pode ter sido deletado
      let memberToDeactivate = await prisma.member.findFirst({
        where: { userId: userId },
      })

      if (!memberToDeactivate) {
        // Se não existe, criar um novo membro
        memberToDeactivate = await prisma.member.create({
          data: {
            name: 'Member para Desativar',
            email: 'memberdeactivate@example.com',
            branchId: branchToDeactivate.id,
            role: 'ADMINGERAL',
            userId: userId,
          },
          include: { Permission: true },
        })

        // Criar permissões para o novo membro
        await prisma.permission.createMany({
          data: [
            { memberId: memberToDeactivate.id, type: 'events_manage' },
            { memberId: memberToDeactivate.id, type: 'contributions_manage' },
            { memberId: memberToDeactivate.id, type: 'members_manage' },
            { memberId: memberToDeactivate.id, type: 'devotional_manage' },
          ],
          skipDuplicates: true,
        })

        // Recarregar com permissões
        memberToDeactivate = await prisma.member.findUnique({
          where: { id: memberToDeactivate.id },
          include: { Permission: true },
        }) as any
      } else {
        // Se existe, atualizar para a nova branch
        memberToDeactivate = await prisma.member.update({
          where: { id: memberToDeactivate.id },
          data: {
            branchId: branchToDeactivate.id,
            role: 'ADMINGERAL',
          },
          include: { Permission: true },
        })
      }

      // Gerar token para o membro atualizado
      const deactivateToken = app.jwt.sign({
        sub: userId,
        email: 'test@example.com',
        name: 'Test User',
        type: 'user',
        memberId: memberToDeactivate.id,
        role: memberToDeactivate.role,
        branchId: memberToDeactivate.branchId,
        churchId: churchToDeactivate.id,
        permissions: memberToDeactivate.Permission.map(p => p.type),
      })

      const response = await request(app.server)
        .patch(`/churches/${churchToDeactivate.id}/deactivate`)
        .set('Authorization', `Bearer ${deactivateToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('isActive', false)
    })

    it('deve retornar 404 quando igreja não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .patch(`/churches/${fakeId}/deactivate`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
    })
  })
})

