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

describe('Members Routes', () => {
  const app = Fastify()
  let adminToken: string
  let adminMemberId: string
  let adminBranchId: string
  let adminChurchId: string
  let coordinatorToken: string
  let coordinatorMemberId: string
  let memberToken: string
  let memberId: string

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

    // Criar igreja
    const church = await prisma.church.create({
      data: {
        name: 'Igreja Teste',
      },
    })
    adminChurchId = church.id

    // Criar filial
    const branch = await prisma.branch.create({
      data: {
        name: 'Filial Teste',
        churchId: church.id,
      },
    })
    adminBranchId = branch.id

    // Criar usuário ADMINGERAL
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })

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
    coordinatorMemberId = coordinatorMember.id

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

    // Criar usuário MEMBER
    const memberUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member@example.com',
        password: await bcrypt.hash('password123', 10),
      },
    })

    const regularMember = await prisma.member.create({
      data: {
        name: 'Regular Member',
        email: 'regularmember@example.com',
        branchId: branch.id,
        role: 'MEMBER',
        userId: memberUser.id,
      },
      include: { Permission: true },
    })
    memberId = regularMember.id

    memberToken = app.jwt.sign({
      sub: memberUser.id,
      email: memberUser.email,
      name: memberUser.name,
      type: 'user',
      memberId: regularMember.id,
      role: regularMember.role,
      branchId: regularMember.branchId,
      churchId: church.id,
      permissions: regularMember.Permission.map(p => p.type),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /members', () => {
    it('ADMINGERAL deve ver todos os membros da igreja', async () => {
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(3) // Admin, Coordinator, Member
    })

    it('COORDINATOR deve ver apenas membros da sua filial', async () => {
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${coordinatorToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      // Coordinator vê membros da mesma filial
      expect(response.body.length).toBeGreaterThanOrEqual(3)
    })

    it('MEMBER deve ver apenas a si mesmo', async () => {
      const response = await request(app.server)
        .get('/members')
        .set('Authorization', `Bearer ${memberToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(1)
      expect(response.body[0]).toHaveProperty('id', memberId)
    })
  })

  describe('GET /members/me', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app.server)
        .get('/members/me')
        .set('Authorization', `Bearer ${memberToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
      expect(response.body).toHaveProperty('name', 'Regular Member')
      expect(response.body).toHaveProperty('email', 'regularmember@example.com')
    })

    it('deve retornar 404 quando usuário não tem membro associado', async () => {
      const userWithoutMember = await prisma.user.create({
        data: {
          name: 'User Without Member',
          email: 'nowmember@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const tokenWithoutMember = app.jwt.sign({
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: userWithoutMember.name,
        type: 'user',
      })

      const response = await request(app.server)
        .get('/members/me')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /members/:id', () => {
    it('ADMINGERAL deve ver qualquer membro da igreja', async () => {
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
    })

    it('COORDINATOR deve ver membros da sua filial', async () => {
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
    })

    it('MEMBER deve ver apenas a si mesmo', async () => {
      const response = await request(app.server)
        .get(`/members/${memberId}`)
        .set('Authorization', `Bearer ${memberToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', memberId)
    })

    it('MEMBER não deve ver outros membros', async () => {
      const response = await request(app.server)
        .get(`/members/${adminMemberId}`)
        .set('Authorization', `Bearer ${memberToken}`)

      expect(response.status).toBe(403)
    })

    it('deve retornar 404 quando membro não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .get(`/members/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /members/:id', () => {
    it('deve atualizar membro com sucesso', async () => {
      const updateData = {
        name: 'Member Atualizado',
        phone: '11999999999',
      }

      const response = await request(app.server)
        .put(`/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('name', 'Member Atualizado')
      expect(response.body).toHaveProperty('phone', '11999999999')
    })

    it('deve retornar 403 quando MEMBER tenta atualizar outro membro', async () => {
      const updateData = {
        name: 'Tentativa de Atualização',
      }

      const response = await request(app.server)
        .put(`/members/${adminMemberId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData)

      expect(response.status).toBe(403)
    })

    it('deve retornar 404 quando membro não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const updateData = {
        name: 'Teste',
      }

      const response = await request(app.server)
        .put(`/members/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(404)
    })
  })
})

