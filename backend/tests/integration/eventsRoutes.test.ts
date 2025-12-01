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

describe('Events Routes', () => {
  const app = Fastify()
  let userToken: string
  let userId: string
  let branchId: string
  let memberId: string
  let churchId: string

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
    churchId = church.id

    // Criar filial
    const branch = await prisma.branch.create({
      data: {
        name: 'Filial Teste',
        churchId: church.id,
      },
    })
    branchId = branch.id

    // Criar usuário
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      },
    })
    userId = user.id

    // Criar membro com permissão events_manage
    const member = await prisma.member.create({
      data: {
        name: 'Test Member',
        email: 'member@example.com',
        branchId: branch.id,
        role: 'ADMINFILIAL',
        userId: user.id,
        Permission: {
          create: { type: 'events_manage' },
        },
      },
      include: { Permission: true },
    })
    memberId = member.id

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

  describe('GET /events', () => {
    it('deve retornar lista vazia quando não há eventos', async () => {
      const response = await request(app.server)
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('deve retornar eventos da filial do usuário', async () => {
      // Criar evento
      const event = await prisma.event.create({
        data: {
          title: 'Evento Teste',
          description: 'Descrição do evento',
          location: 'Local do evento',
          startDate: new Date('2024-12-31T10:00:00Z'),
          endDate: new Date('2024-12-31T12:00:00Z'),
          time: '10:00',
          branchId: branchId,
        },
      })

      const response = await request(app.server)
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('title', 'Evento Teste')
    })

    it('deve retornar array vazio quando usuário não tem branchId', async () => {
      // Criar usuário sem membro
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
        .get('/events')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe('GET /events/next', () => {
    it('deve retornar null quando não há eventos futuros', async () => {
      const response = await request(app.server)
        .get('/events/next')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toBeNull()
    })

    it('deve retornar próximo evento futuro', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const event = await prisma.event.create({
        data: {
          title: 'Próximo Evento',
          description: 'Descrição',
          location: 'Local',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          time: '10:00',
          branchId: branchId,
        },
      })

      const response = await request(app.server)
        .get('/events/next')
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).not.toBeNull()
      expect(response.body).toHaveProperty('id', event.id)
      expect(response.body).toHaveProperty('title', 'Próximo Evento')
    })

    it('deve retornar null quando usuário não tem branchId', async () => {
      const userWithoutMember = await prisma.user.create({
        data: {
          name: 'User Without Member 2',
          email: 'nowmember2@example.com',
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
        .get('/events/next')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toBeNull()
    })
  })

  describe('GET /events/:id', () => {
    it('deve retornar evento por ID', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Evento Detalhes',
          description: 'Descrição detalhada',
          location: 'Local detalhado',
          startDate: new Date('2024-12-31T10:00:00Z'),
          endDate: new Date('2024-12-31T12:00:00Z'),
          time: '10:00',
          branchId: branchId,
        },
      })

      const response = await request(app.server)
        .get(`/events/${event.id}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', event.id)
      expect(response.body).toHaveProperty('title', 'Evento Detalhes')
      expect(response.body).toHaveProperty('Branch')
    })

    it('deve retornar 404 quando evento não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const response = await request(app.server)
        .get(`/events/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message', 'Evento não encontrado')
    })
  })

  describe('POST /events', () => {
    it('deve criar evento com sucesso', async () => {
      const eventData = {
        title: 'Novo Evento',
        description: 'Descrição do novo evento',
        location: 'Local do evento',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        time: '10:00',
        hasDonation: false,
      }

      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send(eventData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Novo Evento')
      expect(response.body).toHaveProperty('branchId', branchId)
    })

    it('deve criar evento com doação', async () => {
      const eventData = {
        title: 'Evento com Doação',
        description: 'Descrição',
        location: 'Local',
        startDate: new Date('2025-01-20T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-20T12:00:00Z').toISOString(),
        time: '10:00',
        hasDonation: true,
        donationReason: 'Construção do templo',
        donationLink: 'https://example.com/doacao',
      }

      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send(eventData)

      logTestResponse(response, 201)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('hasDonation', true)
      expect(response.body).toHaveProperty('donationReason', 'Construção do templo')
      expect(response.body).toHaveProperty('donationLink', 'https://example.com/doacao')
    })

    it('deve retornar 400 quando usuário não tem branchId', async () => {
      const userWithoutMember = await prisma.user.create({
        data: {
          name: 'User Without Member 3',
          email: 'nowmember3@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const tokenWithoutMember = app.jwt.sign({
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: userWithoutMember.name,
        type: 'user',
      })

      const eventData = {
        title: 'Evento Teste',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        location: 'Local',
      }

      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)
        .send(eventData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })

    it('deve retornar 400 quando dados inválidos', async () => {
      const eventData = {
        // Faltando campos obrigatórios
        title: 'Evento Incompleto',
      }

      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send(eventData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    it('deve retornar 403 quando usuário não tem permissão', async () => {
      // Criar membro sem permissão events_manage
      const userWithoutPermission = await prisma.user.create({
        data: {
          name: 'User No Permission',
          email: 'nopermission@example.com',
          password: await bcrypt.hash('password123', 10),
        },
      })

      const memberWithoutPermission = await prisma.member.create({
        data: {
          name: 'Member No Permission',
          email: 'membernoperm@example.com',
          branchId: branchId,
          role: 'MEMBER',
          userId: userWithoutPermission.id,
        },
      })

      const tokenWithoutPermission = app.jwt.sign({
        sub: userWithoutPermission.id,
        email: userWithoutPermission.email,
        name: userWithoutPermission.name,
        type: 'user',
        memberId: memberWithoutPermission.id,
        role: memberWithoutPermission.role,
        branchId: memberWithoutPermission.branchId,
        churchId: churchId,
        permissions: [],
      })

      const eventData = {
        title: 'Evento Teste',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        location: 'Local',
      }

      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${tokenWithoutPermission}`)
        .send(eventData)

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /events/:id', () => {
    it('deve atualizar evento com sucesso', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Evento Original',
          description: 'Descrição original',
          location: 'Local original',
          startDate: new Date('2025-02-01T10:00:00Z'),
          endDate: new Date('2025-02-01T12:00:00Z'),
          time: '10:00',
          branchId: branchId,
        },
      })

      const updateData = {
        title: 'Evento Atualizado',
        description: 'Nova descrição',
        location: 'Novo local',
        startDate: new Date('2025-02-02T10:00:00Z').toISOString(),
        endDate: new Date('2025-02-02T12:00:00Z').toISOString(),
      }

      const response = await request(app.server)
        .put(`/events/${event.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)

      logTestResponse(response, 200)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Evento Atualizado')
      expect(response.body).toHaveProperty('description', 'Nova descrição')
      expect(response.body).toHaveProperty('location', 'Novo local')
    })

    it('deve retornar 404 quando evento não existe', async () => {
      const fakeId = 'cmic00000000000000000000000'

      const updateData = {
        title: 'Evento Atualizado',
      }

      const response = await request(app.server)
        .put(`/events/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)

      logTestResponse(response, 404)
      expect(response.status).toBe(404)
    })
  })

})

