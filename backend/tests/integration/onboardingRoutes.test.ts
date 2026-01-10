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

describe('Onboarding Routes - Integration Tests', () => {
  let app: FastifyInstance
  let planId: string

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('POST /register - Public Registration (fromLandingPage)', () => {
    beforeEach(async () => {
      await resetTestDatabase()

      // Criar plano Free Plan (necessário para registro público criar subscription)
      await createTestPlan({
        name: 'Free Plan',
        maxMembers: 10,
        maxBranches: 1,
      })
    })

    // Teste 1: 200/201 Success
    it('deve criar usuário público e retornar token (201 Created)', async () => {
      // Given: Dados de registro válidos
      // When: POST /register com fromLandingPage
      const response = await request(app.server)
        .post('/register')
        .send({
          name: 'Novo Usuário',
          email: `newuser-${Date.now()}@test.com`,
          password: 'password123',
          fromLandingPage: true,
        })

      // Then: Retorna 201 com token e user
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user).toHaveProperty('email')
    })

    // Teste 2: 400 Invalid payload
    it('deve retornar 400 se campos obrigatórios estiverem ausentes', async () => {
      // Given: Requisição sem campos obrigatórios
      // When: POST /register sem name/email/password
      const response = await request(app.server)
        .post('/register')
        .send({
          fromLandingPage: true,
        })

      // Then: Retorna 400
      expect(response.status).toBe(400)
    })

    // Teste 3: 401 Unauthenticated (não aplicável para registro público)

    // Teste 4: 403 Forbidden (não aplicável)

    // Teste 5: 409 Conflict - Email duplicado
    it('deve retornar 400 ou 409 se email já existe', async () => {
      // Given: Email já cadastrado
      const email = `duplicate-${Date.now()}@test.com`

      await request(app.server).post('/register').send({
        name: 'Usuário 1',
        email,
        password: 'password123',
        fromLandingPage: true,
      })

      // When: Tentar registrar novamente com mesmo email
      const response = await request(app.server).post('/register').send({
        name: 'Usuário 2',
        email,
        password: 'password123',
        fromLandingPage: true,
      })

      // Then: Retorna 400 ou 409
      expect([400, 409]).toContain(response.status)
      expect(response.body.error || response.body.message).toBeDefined()
    })

    // Teste 6: 422 Business rule (não aplicável para registro público)

    // Teste 7: DB side-effect assertions
    it('deve criar User e Subscription no banco ao registrar', async () => {
      // Given: Dados de registro
      const email = `db-test-${Date.now()}@test.com`

      // When: POST /register
      const response = await request(app.server)
        .post('/register')
        .send({
          name: 'User DB Test',
          email,
          password: 'password123',
          fromLandingPage: true,
        })

      expect(response.status).toBe(201)

      // Then: Verifica side-effects no banco
      const user = await prisma.user.findUnique({
        where: { email },
        include: { Subscription: true },
      })

      expect(user).toBeDefined()
      expect(user?.email).toBe(email)
      expect(user?.Subscription.length).toBeGreaterThan(0)
    })
  })

  describe('GET /onboarding/state - Onboarding State', () => {
    let userToken: string
    let userId: string

    beforeEach(async () => {
      await resetTestDatabase()

      // Criar plano após reset (necessário para subscription)
      const plan = await createTestPlan({
        name: 'Free Plan',
        maxMembers: 10,
        maxBranches: 1,
      })
      const planId = plan.id

      // Criar User sem Member
      const user = await createTestUser({
        email: `onboarding-${Date.now()}@test.com`,
        firstName: 'Onboarding',
        lastName: 'User',
      })

      await createTestSubscription(user.id, planId, SubscriptionStatus.active)

      userId = user.id

      userToken = await generateTestToken(app, {
        sub: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        type: 'user',
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
        onboardingCompleted: false,
      })
    })

    // Teste 1: 200/201 Success - Status NEW
    it('deve retornar status NEW quando usuário não tem igreja (200 OK)', async () => {
      // Given: Usuário sem igreja
      // When: GET /onboarding/state
      const response = await request(app.server)
        .get('/onboarding/state')
        .set('Authorization', `Bearer ${userToken}`)

      // Then: Retorna 200 com status NEW
      expect(response.status).toBe(200)
      expect(response.body.status).toBe('NEW')
    })

    // Teste 2: 400 Invalid payload (não aplicável para GET)

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se não estiver autenticado', async () => {
      // Given: Requisição sem token
      // When: GET /onboarding/state sem Authorization
      const response = await request(app.server)
        .get('/onboarding/state')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste adicional: Status PENDING
    it('deve retornar status PENDING quando usuário tem igreja mas não completou onboarding', async () => {
      // Given: Usuário com igreja criada
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Pendente',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse.status).toBe(201)

      // When: GET /onboarding/state (com token original que não tem memberId completo)
      const response = await request(app.server)
        .get('/onboarding/state')
        .set('Authorization', `Bearer ${userToken}`)

      // Then: Retorna 200 com status PENDING
      expect(response.status).toBe(200)
      expect(response.body.status).toBe('PENDING')
      expect(response.body.church).toBeDefined()
    })

    // Teste adicional: Status COMPLETE
    it('deve retornar status COMPLETE quando onboarding está completo', async () => {
      // Given: Usuário com igreja e member completo
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Completa',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse.status).toBe(201)
      const memberToken = churchResponse.body.token

      // When: GET /onboarding/state com token que tem memberId
      const response = await request(app.server)
        .get('/onboarding/state')
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200 com status COMPLETE
      expect(response.status).toBe(200)
      expect(response.body.status).toBe('COMPLETE')
      expect(response.body.church).toBeDefined()
      expect(response.body.branch).toBeDefined()
      expect(response.body.member).toBeDefined()
    })
  })

  describe('Fluxo Completo de Onboarding E2E', () => {
    beforeEach(async () => {
      await resetTestDatabase()

      // Criar plano Free Plan (necessário para registro público criar subscription)
      await createTestPlan({
        name: 'Free Plan',
        maxMembers: 10,
        maxBranches: 1,
      })
    })

    it('deve completar todo o fluxo: registro público → criar igreja → onboarding completo', async () => {
      // Given: Usuário novo sem conta
      // Step 1: Registro público
      const registerResponse = await request(app.server)
        .post('/register')
        .send({
          name: 'Usuário Completo',
          email: `complete-${Date.now()}@test.com`,
          password: 'password123',
          fromLandingPage: true,
        })

      expect(registerResponse.status).toBe(201)
      const registerToken = registerResponse.body.token

      // Step 2: Criar Igreja (onboarding)
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${registerToken}`)
        .send({
          name: 'Igreja Completa',
          withBranch: true,
          branchName: 'Sede',
        })

      expect(churchResponse.status).toBe(201)

      // Then: Verifica que tudo foi criado corretamente
      expect(churchResponse.body.church).toBeDefined()
      expect(churchResponse.body.branch).toBeDefined()
      expect(churchResponse.body.member).toBeDefined()
      expect(churchResponse.body.member.role).toBe('ADMINGERAL')

      // Verifica no banco
      const church = await prisma.church.findUnique({
        where: { id: churchResponse.body.church.id },
        include: { Branch: true },
      })
      expect(church).toBeDefined()
      expect(church?.Branch.length).toBe(1)
      expect(church?.Branch[0].isMainBranch).toBe(true)

      // Verifica onboarding state
      const memberToken = churchResponse.body.token
      const stateResponse = await request(app.server)
        .get('/onboarding/state')
        .set('Authorization', `Bearer ${memberToken}`)

      expect(stateResponse.status).toBe(200)
      expect(stateResponse.body.status).toBe('COMPLETE')
    })
  })

  describe('POST /branches - Criação de Filiais', () => {
    let churchId: string
    let memberToken: string
    let userToken: string
    let userId: string

    beforeEach(async () => {
      await resetTestDatabase()

      // Criar plano novamente após reset com maxBranches suficiente
      const plan = await createTestPlan({
        name: 'Free Plan',
        maxMembers: 10,
        maxBranches: 2, // Permite criar filial adicional após branch principal
      })

      // Criar User
      const user = await createTestUser({
        email: `branches-${Date.now()}@test.com`,
        firstName: 'Branches',
        lastName: 'User',
      })

      await createTestSubscription(user.id, plan.id, SubscriptionStatus.active)

      userId = user.id

      userToken = await generateTestToken(app, {
        sub: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        type: 'user',
        memberId: null,
        role: null,
        branchId: null,
        churchId: null,
        permissions: [],
        onboardingCompleted: false,
      })

      // Cria igreja antes de cada teste
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja para Filiais',
          withBranch: true,
          branchName: 'Sede',
        })

      churchId = churchResponse.body.church.id
      memberToken = churchResponse.body.token || userToken
    })

    it('deve criar filial com sucesso (201 Created)', async () => {
      // Given: Plano com limite suficiente (maxBranches: 2 no beforeEach) e churchId válido
      // Nota: O plano foi criado no beforeEach com maxBranches: 2, então permite criar filial adicional
      // O usuário já tem uma branch principal criada no POST /churches, então precisa de maxBranches >= 2

      // When: POST /branches
      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Filial Centro',
          churchId,
        })

      // Then: Retorna 201 com filial criada
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.name).toBe('Filial Centro')
      expect(response.body.churchId).toBe(churchId)
    })

    it('deve retornar erro se churchId não existe', async () => {
      // Given: churchId inválido
      // When: POST /branches com churchId inexistente
      const response = await request(app.server)
        .post('/branches')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Filial Inválida',
          churchId: 'invalid-church-id',
        })

      // Then: Retorna 400
      expect(response.status).toBe(400)
    })
  })

  describe('Fluxo Completo de Onboarding', () => {
    beforeEach(async () => {
      await resetTestDatabase()

      // Criar plano Free Plan (necessário para registro público criar subscription)
      await createTestPlan({
        name: 'Free Plan',
        maxMembers: 10,
        maxBranches: 1,
      })
    })

    it('deve completar todo o fluxo: registro → igreja', async () => {
      // Given: Usuário novo sem conta
      // Step 1: Registro público
      const registerResponse = await request(app.server)
        .post('/register')
        .send({
          name: 'Usuário Completo',
          email: `complete-${Date.now()}@test.com`,
          password: 'password123',
          fromLandingPage: true,
        })

      // Then: Registro bem-sucedido
      expect(registerResponse.status).toBe(201)
      const registerToken = registerResponse.body.token

      // Step 2: Criar Igreja (onboarding)
      const churchResponse = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${registerToken}`)
        .send({
          name: 'Igreja Completa',
          withBranch: true,
          branchName: 'Sede',
        })

      // Then: Igreja criada com sucesso
      expect(churchResponse.status).toBe(201)

      // Verifica que tudo foi criado
      expect(churchResponse.body.church).toBeDefined()
      expect(churchResponse.body.branch).toBeDefined()
      expect(churchResponse.body.member).toBeDefined()
    })
  })
})

