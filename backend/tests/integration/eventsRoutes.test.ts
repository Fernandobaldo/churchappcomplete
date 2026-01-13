// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import { resetTestDatabase } from '../utils/db'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { 
  createTestUser, 
  createTestMember, 
  createTestChurch, 
  createTestBranch, 
  createTestPlan, 
  createTestSubscription 
} from '../utils/testFactories'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'

describe('Events Routes - Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let adminUser: any
  let adminMember: any
  let adminToken: string
  let branchId: string
  let churchId: string

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()

    // Criar plano para testes
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 1,
    })
    planId = plan.id
  })

  beforeEach(async () => {
    await resetTestDatabase()

    // Criar plano novamente após reset
    const plan = await createTestPlan({
      name: 'Free Plan',
      maxMembers: 10,
      maxBranches: 1,
    })
    planId = plan.id

    // Criar User
    adminUser = await createTestUser({
      email: `admin-${Date.now()}@test.com`,
      firstName: 'Admin',
      lastName: 'User',
      password: 'password123',
    })

    await createTestSubscription(adminUser.id, planId, SubscriptionStatus.active)

    // Criar Church
    const church = await createTestChurch({
      name: 'Igreja Teste',
      createdByUserId: adminUser.id,
    })
    churchId = church.id

    // Criar Branch
    const branch = await createTestBranch({
      churchId: church.id,
      name: 'Filial Teste',
      isMainBranch: true,
    })
    branchId = branch.id

    // Criar Member com permissão events_manage
    adminMember = await createTestMember({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'ADMINFILIAL' as any,
      branchId: branch.id,
    })

    // Criar Permission para events_manage
    await prisma.permission.create({
      data: {
        memberId: adminMember.id,
        type: 'events_manage',
      },
    })

    // Buscar member com permissions para gerar token
    const memberWithPermissions = await prisma.member.findUnique({
      where: { id: adminMember.id },
      include: { Permission: true },
    })

    adminToken = await generateTestToken(app, {
      sub: adminUser.id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`.trim(),
      type: 'member',
      memberId: adminMember.id,
      role: adminMember.role,
      branchId: branch.id,
      churchId: church.id,
      permissions: memberWithPermissions!.Permission.map(p => p.type),
      onboardingCompleted: true,
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('GET /events', () => {
    // Teste 1: 200/201 Success
    it('deve retornar lista vazia quando não há eventos (200 OK)', async () => {
      // Given: Usuário autenticado sem eventos
      // When: GET /events
      const response = await request(app.server)
        .get('/events')
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com array vazio
      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    // Teste 2: 200/201 Success - Com eventos
    it('deve retornar eventos da filial do usuário', async () => {
      // Given: Evento criado na filial do usuário
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

      // When: GET /events
      const response = await request(app.server)
        .get('/events')
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com array contendo o evento
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('title', 'Evento Teste')
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      // When: GET /events sem Authorization
      const response = await request(app.server).get('/events')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 4: Edge case - Usuário sem branchId
    it('deve retornar array vazio quando usuário não tem branchId', async () => {
      // Given: Usuário sem member/branchId
      const userWithoutMember = await createTestUser({
        email: `nowmember-${Date.now()}@test.com`,
        firstName: 'User',
        lastName: 'Without Member',
      })

      await createTestSubscription(userWithoutMember.id, planId, SubscriptionStatus.active)

      const tokenWithoutMember = await generateTestToken(app, {
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: `${userWithoutMember.firstName} ${userWithoutMember.lastName}`.trim(),
        type: 'user',
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
        onboardingCompleted: false,
      })

      // When: GET /events
      const response = await request(app.server)
        .get('/events')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      // Then: Retorna 200 com array vazio
      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe('GET /events/next', () => {
    // Teste 1: 200/201 Success - Sem eventos futuros
    it('deve retornar null quando não há eventos futuros (200 OK)', async () => {
      // Given: Usuário autenticado sem eventos futuros
      // When: GET /events/next
      const response = await request(app.server)
        .get('/events/next')
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com null
      expect(response.status).toBe(200)
      expect(response.body).toBeNull()
    })

    // Teste 2: 200/201 Success - Com evento futuro
    it('deve retornar próximo evento futuro', async () => {
      // Given: Evento futuro criado
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

      // When: GET /events/next
      const response = await request(app.server)
        .get('/events/next')
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com próximo evento
      expect(response.status).toBe(200)
      expect(response.body).not.toBeNull()
      expect(response.body).toHaveProperty('id', event.id)
      expect(response.body).toHaveProperty('title', 'Próximo Evento')
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      // When: GET /events/next sem Authorization
      const response = await request(app.server).get('/events/next')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 4: Edge case - Usuário sem branchId
    it('deve retornar null quando usuário não tem branchId', async () => {
      // Given: Usuário sem member/branchId
      const userWithoutMember = await createTestUser({
        email: `nowmember2-${Date.now()}@test.com`,
      })

      await createTestSubscription(userWithoutMember.id, planId, SubscriptionStatus.active)

      const tokenWithoutMember = await generateTestToken(app, {
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: `${userWithoutMember.firstName} ${userWithoutMember.lastName}`.trim(),
        type: 'user',
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
        onboardingCompleted: false,
      })

      // When: GET /events/next
      const response = await request(app.server)
        .get('/events/next')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)

      // Then: Retorna 200 com null
      expect(response.status).toBe(200)
      expect(response.body).toBeNull()
    })
  })

  describe('GET /events/:id', () => {
    // Teste 1: 200/201 Success
    it('deve retornar evento por ID (200 OK)', async () => {
      // Given: Evento criado
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

      // When: GET /events/:id
      const response = await request(app.server)
        .get(`/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 200 com dados do evento
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', event.id)
      expect(response.body).toHaveProperty('title', 'Evento Detalhes')
      expect(response.body).toHaveProperty('Branch')
    })

    // Teste 2: 404 Not Found
    it('deve retornar 404 quando evento não existe', async () => {
      // Given: ID de evento inexistente
      const fakeId = 'cmic00000000000000000000000'

      // When: GET /events/:id
      const response = await request(app.server)
        .get(`/events/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then: Retorna 404
      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('message', 'Evento não encontrado')
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      const fakeId = 'cmic00000000000000000000000'

      // When: GET /events/:id sem Authorization
      const response = await request(app.server).get(`/events/${fakeId}`)

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })
  })

  describe('POST /events', () => {
    // Teste 1: 200/201 Success
    it('deve criar evento com sucesso (201 Created)', async () => {
      // Given: Dados válidos de evento
      const eventData = {
        title: 'Novo Evento',
        description: 'Descrição do novo evento',
        location: 'Local do evento',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        time: '10:00',
        hasDonation: false,
      }

      // When: POST /events
      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)

      // Then: Retorna 201 com evento criado
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Novo Evento')
      expect(response.body).toHaveProperty('branchId', branchId)
    })

    // Teste 2: 200/201 Success - Com doação
    it('deve criar evento com doação', async () => {
      // Given: Dados válidos de evento com doação
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

      // When: POST /events
      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)

      // Then: Retorna 201 com evento criado e dados de doação
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('hasDonation', true)
      expect(response.body).toHaveProperty('donationReason', 'Construção do templo')
      expect(response.body).toHaveProperty('donationLink', 'https://example.com/doacao')
    })

    // Teste 3: 400 Invalid payload
    it('deve retornar 400 quando dados inválidos', async () => {
      // Given: Dados incompletos (faltando campos obrigatórios)
      const eventData = {
        title: 'Evento Incompleto',
      }

      // When: POST /events
      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)

      // Then: Retorna 400
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Dados inválidos')
    })

    // Teste 4: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Dados válidos sem token
      const eventData = {
        title: 'Novo Evento',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        location: 'Local',
      }

      // When: POST /events sem Authorization
      const response = await request(app.server)
        .post('/events')
        .send(eventData)

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 5: 403 Forbidden
    it('deve retornar 403 quando usuário não tem permissão', async () => {
      // Given: Usuário sem permissão events_manage
      const userWithoutPermission = await createTestUser({
        email: `nopermission-${Date.now()}@test.com`,
      })

      await createTestSubscription(userWithoutPermission.id, planId, SubscriptionStatus.active)

      const memberWithoutPermission = await createTestMember({
        userId: userWithoutPermission.id,
        email: userWithoutPermission.email,
        role: 'MEMBER' as any,
        branchId: branchId,
      })

      const tokenWithoutPermission = await generateTestToken(app, {
        sub: userWithoutPermission.id,
        email: userWithoutPermission.email,
        name: `${userWithoutPermission.firstName} ${userWithoutPermission.lastName}`.trim(),
        type: 'member',
        memberId: memberWithoutPermission.id,
        role: memberWithoutPermission.role,
        branchId: branchId,
        churchId: churchId,
        permissions: [],
        onboardingCompleted: true,
      })

      const eventData = {
        title: 'Evento Teste',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        location: 'Local',
      }

      // When: POST /events
      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${tokenWithoutPermission}`)
        .send(eventData)

      // Then: Retorna 403
      expect(response.status).toBe(403)
    })

    // Teste 6: 400 - Edge case - Usuário sem branchId
    it('deve retornar 400 quando usuário não tem branchId', async () => {
      // Given: Usuário sem member/branchId
      const userWithoutMember = await createTestUser({
        email: `nowmember3-${Date.now()}@test.com`,
      })

      await createTestSubscription(userWithoutMember.id, planId, SubscriptionStatus.active)

      const tokenWithoutMember = await generateTestToken(app, {
        sub: userWithoutMember.id,
        email: userWithoutMember.email,
        name: `${userWithoutMember.firstName} ${userWithoutMember.lastName}`.trim(),
        type: 'user',
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
        onboardingCompleted: false,
      })

      const eventData = {
        title: 'Evento Teste',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        location: 'Local',
      }

      // When: POST /events
      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${tokenWithoutMember}`)
        .send(eventData)

      // Then: Retorna 400
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })

    // Teste 7: DB side-effect assertions
    it('deve criar evento no banco de dados', async () => {
      // Given: Dados válidos de evento
      const eventData = {
        title: 'Evento DB Test',
        description: 'Teste de side-effect',
        location: 'Local Teste',
        startDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        endDate: new Date('2025-01-15T12:00:00Z').toISOString(),
        time: '10:00',
        hasDonation: false,
      }

      // When: POST /events
      const response = await request(app.server)
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)

      expect(response.status).toBe(201)
      const eventId = response.body.id

      // Then: Evento foi criado no banco
      const eventInDb = await prisma.event.findUnique({
        where: { id: eventId },
      })

      expect(eventInDb).not.toBeNull()
      expect(eventInDb?.title).toBe('Evento DB Test')
      expect(eventInDb?.branchId).toBe(branchId)
      expect(eventInDb?.description).toBe('Teste de side-effect')
    })

    // Teste 8: Proteção contra requisições simultâneas (double-click)
    it('deve criar evento mesmo se requisições simultâneas forem enviadas (backend permite, frontend deve prevenir)', async () => {
      // Given: Dados válidos de evento
      const eventData = {
        title: 'Evento Simultâneo',
        description: 'Descrição do evento',
        location: 'Local do evento',
        startDate: new Date('2025-03-01T10:00:00Z').toISOString(),
        endDate: new Date('2025-03-01T12:00:00Z').toISOString(),
        time: '10:00',
        hasDonation: false,
      }

      // When: Enviar requisições simultâneas (simula double-click)
      const [response1, response2] = await Promise.all([
        request(app.server)
          .post('/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(eventData),
        request(app.server)
          .post('/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(eventData),
      ])

      // Then: Backend cria ambos eventos (não há validação de duplicação)
      // Este teste documenta o comportamento atual: backend permite duplicação
      // A prevenção deve ser feita no frontend (testado nos testes mobile)
      expect(response1.status).toBe(201)
      expect(response2.status).toBe(201)
      
      // Verifica que ambos foram criados
      const events = await prisma.event.findMany({
        where: {
          title: 'Evento Simultâneo',
          branchId: branchId,
        },
      })
      
      // Ambos eventos foram criados (comportamento atual - sem validação de duplicação)
      expect(events.length).toBe(2)
      expect(events[0].id).not.toBe(events[1].id)
    })
  })

  describe('PUT /events/:id', () => {
    // Teste 1: 200/201 Success
    it('deve atualizar evento com sucesso (200 OK)', async () => {
      // Given: Evento existente
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

      // When: PUT /events/:id
      const response = await request(app.server)
        .put(`/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 200 com evento atualizado
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('title', 'Evento Atualizado')
      expect(response.body).toHaveProperty('description', 'Nova descrição')
      expect(response.body).toHaveProperty('location', 'Novo local')
    })

    // Teste 2: 404 Not Found
    it('deve retornar 404 quando evento não existe', async () => {
      // Given: ID de evento inexistente
      const fakeId = 'cmic00000000000000000000000'
      const updateData = {
        title: 'Evento Atualizado',
      }

      // When: PUT /events/:id
      const response = await request(app.server)
        .put(`/events/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 404
      expect(response.status).toBe(404)
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      const fakeId = 'cmic00000000000000000000000000'
      const updateData = {
        title: 'Evento Atualizado',
      }

      // When: PUT /events/:id sem Authorization
      const response = await request(app.server)
        .put(`/events/${fakeId}`)
        .send(updateData)

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 4: 200/201 Success - Atualizar imageUrl
    it('deve atualizar imageUrl do evento com sucesso', async () => {
      // Given: Evento existente com imageUrl
      const event = await prisma.event.create({
        data: {
          title: 'Evento com Banner',
          description: 'Descrição',
          location: 'Local',
          startDate: new Date('2025-02-01T10:00:00Z'),
          endDate: new Date('2025-02-01T12:00:00Z'),
          time: '10:00',
          imageUrl: '/uploads/event-images/old-banner.jpg',
          branchId: branchId,
        },
      })

      const updateData = {
        title: 'Evento Atualizado',
        imageUrl: '/uploads/event-images/new-banner.jpg',
      }

      // When: PUT /events/:id com novo imageUrl
      const response = await request(app.server)
        .put(`/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 200 com imageUrl atualizado
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('imageUrl', '/uploads/event-images/new-banner.jpg')
      
      // Verificar no banco
      const eventInDb = await prisma.event.findUnique({
        where: { id: event.id },
      })
      expect(eventInDb?.imageUrl).toBe('/uploads/event-images/new-banner.jpg')
    })

    // Teste 5: 200/201 Success - Remover imageUrl (null)
    it('deve permitir remover imageUrl definindo como null', async () => {
      // Given: Evento existente com imageUrl
      const event = await prisma.event.create({
        data: {
          title: 'Evento com Banner',
          description: 'Descrição',
          location: 'Local',
          startDate: new Date('2025-02-01T10:00:00Z'),
          endDate: new Date('2025-02-01T12:00:00Z'),
          time: '10:00',
          imageUrl: '/uploads/event-images/banner.jpg',
          branchId: branchId,
        },
      })

      const updateData = {
        title: 'Evento Sem Banner',
        imageUrl: null,
      }

      // When: PUT /events/:id com imageUrl null
      const response = await request(app.server)
        .put(`/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      // Then: Retorna 200 com imageUrl null
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('imageUrl', null)
      
      // Verificar no banco
      const eventInDb = await prisma.event.findUnique({
        where: { id: event.id },
      })
      expect(eventInDb?.imageUrl).toBeNull()
    })

    // Teste 6: DB side-effect assertions - Verificar que outros campos não são afetados
    it('deve atualizar apenas imageUrl sem afetar outros campos', async () => {
      // Given: Evento existente
      const event = await prisma.event.create({
        data: {
          title: 'Evento Original',
          description: 'Descrição original',
          location: 'Local original',
          startDate: new Date('2025-02-01T10:00:00Z'),
          endDate: new Date('2025-02-01T12:00:00Z'),
          time: '10:00',
          imageUrl: '/uploads/event-images/old.jpg',
          branchId: branchId,
        },
      })

      const updateData = {
        imageUrl: '/uploads/event-images/new.jpg',
      }

      // When: PUT /events/:id apenas com imageUrl
      const response = await request(app.server)
        .put(`/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(200)

      // Then: Apenas imageUrl foi atualizado, outros campos permanecem
      const eventInDb = await prisma.event.findUnique({
        where: { id: event.id },
      })
      expect(eventInDb?.imageUrl).toBe('/uploads/event-images/new.jpg')
      expect(eventInDb?.title).toBe('Evento Original')
      expect(eventInDb?.description).toBe('Descrição original')
      expect(eventInDb?.location).toBe('Local original')
    })
  })
})
