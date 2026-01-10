// Integration tests para endpoints de onboarding progress
// Padrão obrigatório: 7 testes por endpoint crítico
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { createTestUser, createTestMember, createTestChurch, createTestBranch, createTestPlan, createTestSubscription, createTestOnboardingProgress } from '../utils/testFactories'
import { resetTestDatabase } from '../utils/db'
import { prisma } from '../../src/lib/prisma'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'

describe('Onboarding Progress Endpoints - Integration Tests', () => {
  let app: FastifyInstance
  let planId: string
  let testUser: any
  let userToken: string

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

    // Criar User sem Member
    testUser = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    })

    await createTestSubscription(testUser.id, planId, SubscriptionStatus.active)

    userToken = await generateTestToken(app, {
      sub: testUser.id,
      email: testUser.email,
      name: `${testUser.firstName} ${testUser.lastName}`.trim(),
      type: 'user',
      memberId: null,
      role: null,
      branchId: null,
      churchId: null,
      permissions: [],
      onboardingCompleted: false,
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('GET /onboarding/progress', () => {
    // Teste 1: 200/201 Success
    it('deve retornar progresso atual do usuário (200 OK)', async () => {
      // Given: Progresso de onboarding criado
      const userId = testUser.id
      await createTestOnboardingProgress(userId, {
        churchConfigured: true,
        branchesConfigured: false,
        settingsConfigured: false,
        completed: false,
      })

      // When: GET /onboarding/progress
      const response = await request(app.server)
        .get('/onboarding/progress')
        .set('Authorization', `Bearer ${userToken}`)

      // Then: Retorna 200 com dados do progresso
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('churchConfigured')
      expect(response.body).toHaveProperty('branchesConfigured')
      expect(response.body).toHaveProperty('settingsConfigured')
      expect(response.body).toHaveProperty('completed')
      expect(response.body.churchConfigured).toBe(true)
      expect(response.body.branchesConfigured).toBe(false)
      expect(response.body.settingsConfigured).toBe(false)
      expect(response.body.completed).toBe(false)
    })

    // Teste 2: 400 Invalid payload (não aplicável para GET)
    // Pulado - GET não tem payload

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      // When: GET /onboarding/progress sem Authorization
      const response = await request(app.server).get('/onboarding/progress')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 4: 403 Forbidden (não aplicável)
    // Pulado - não há verificação de role/permission específica

    // Teste 5: 409 Conflict/Idempotency (não aplicável)
    // Pulado - GET não cria recursos

    // Teste 6: 422 Business rule (não aplicável)
    // Pulado - GET não valida regras de negócio

    // Teste 7: DB side-effect assertions
    it('deve criar progresso automaticamente se não existe', async () => {
      // Given: Usuário sem progresso de onboarding
      const userId = testUser.id

      // Verificar que não existe progresso
      const before = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(before).toBeNull()

      // When: GET /onboarding/progress
      const response = await request(app.server)
        .get('/onboarding/progress')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)

      // Then: Progresso foi criado no banco
      const after = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(after).not.toBeNull()
      expect(after?.userId).toBe(userId)
    })
  })

  describe('POST /onboarding/progress/:step', () => {
    // Teste 1: 200/201 Success
    it('deve marcar etapa church como completa (200 OK)', async () => {
      // Given: Progresso de onboarding criado
      const userId = testUser.id
      await createTestOnboardingProgress(userId)

      // When: POST /onboarding/progress/church
      const response = await request(app.server)
        .post('/onboarding/progress/church')
        .set('Authorization', `Bearer ${userToken}`)

      // Then: Retorna 200 e marca como completo
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')

      // Verificar no banco
      const progress = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(progress?.churchConfigured).toBe(true)
    })

    // Teste 2: 400 Invalid payload
    it('deve retornar 400 se step for inválido', async () => {
      // Given: Step inválido na URL
      // When: POST /onboarding/progress/invalid-step
      const response = await request(app.server)
        .post('/onboarding/progress/invalid-step')
        .set('Authorization', `Bearer ${userToken}`)

      // Then: Retorna 400
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message')
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      // When: POST /onboarding/progress/church sem Authorization
      const response = await request(app.server).post('/onboarding/progress/church')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 4: 403 Forbidden (não aplicável)
    // Pulado - não há verificação de role/permission específica

    // Teste 5: 409 Conflict/Idempotency
    it('deve ser idempotente - marcar mesma etapa múltiplas vezes', async () => {
      // Given: Etapa já marcada como completa
      const userId = testUser.id
      await createTestOnboardingProgress(userId, {
        churchConfigured: true,
      })

      // When: POST /onboarding/progress/church múltiplas vezes
      const response1 = await request(app.server)
        .post('/onboarding/progress/church')
        .set('Authorization', `Bearer ${userToken}`)

      const response2 = await request(app.server)
        .post('/onboarding/progress/church')
        .set('Authorization', `Bearer ${userToken}`)

      // Then: Ambas retornam 200 e etapa continua true
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verificar no banco que continua true
      const progress = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(progress?.churchConfigured).toBe(true)
    })

    // Teste 6: 422 Business rule (não aplicável)
    // Pulado - não há regras de negócio específicas

    // Teste 7: DB side-effect assertions
    it('deve criar progresso automaticamente se não existe ao marcar etapa', async () => {
      // Given: Usuário sem progresso de onboarding
      const userId = testUser.id

      // Verificar que não existe
      const before = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(before).toBeNull()

      // When: POST /onboarding/progress/branches
      const response = await request(app.server)
        .post('/onboarding/progress/branches')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)

      // Then: Progresso foi criado e etapa marcada no banco
      const after = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(after).not.toBeNull()
      expect(after?.branchesConfigured).toBe(true)
    })
  })

  describe('POST /onboarding/complete', () => {
    // Teste 1: 200/201 Success
    it('deve marcar onboarding como completo e retornar token atualizado (200 OK)', async () => {
      // Given: User com church/branch/member e progresso quase completo
      const userId = testUser.id
      const church = await createTestChurch({
        name: 'Test Church',
        createdByUserId: userId,
      })
      const branch = await createTestBranch({
        churchId: church.id,
        name: 'Sede',
        isMainBranch: true,
      })
      const member = await createTestMember({
        userId: userId,
        email: testUser.email,
        role: 'ADMINGERAL' as any,
        branchId: branch.id,
      })

      await createTestOnboardingProgress(userId, {
        churchConfigured: true,
        branchesConfigured: true,
        settingsConfigured: true,
        completed: false,
      })

      const memberToken = await generateTestToken(app, {
        sub: userId,
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`.trim(),
        type: 'member',
        memberId: member.id,
        branchId: branch.id,
        role: member.role,
        churchId: church.id,
        permissions: [],
        onboardingCompleted: false,
      })

      // When: POST /onboarding/complete
      const response = await request(app.server)
        .post('/onboarding/complete')
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200 com completed=true e token atualizado
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('completed', true)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('completedAt')

      // Verificar no banco
      const progress = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(progress?.completed).toBe(true)
      expect(progress?.completedAt).not.toBeNull()

      // Verificar que token inclui onboardingCompleted = true
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(response.body.token)
      expect(decoded.onboardingCompleted).toBe(true)
    })

    // Teste 2: 400 Invalid payload (não aplicável)
    // Pulado - POST /complete não tem payload

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      // Given: Requisição sem token
      // When: POST /onboarding/complete sem Authorization
      const response = await request(app.server).post('/onboarding/complete')

      // Then: Retorna 401
      expect(response.status).toBe(401)
    })

    // Teste 4: 403 Forbidden (não aplicável)
    // Pulado - não há verificação de role/permission específica

    // Teste 5: 409 Conflict/Idempotency
    it('deve ser idempotente - marcar completo múltiplas vezes', async () => {
      // Given: Onboarding já completo
      const userId = testUser.id
      const church = await createTestChurch({
        name: 'Test Church',
        createdByUserId: userId,
      })
      const branch = await createTestBranch({
        churchId: church.id,
        name: 'Sede',
        isMainBranch: true,
      })
      const member = await createTestMember({
        userId: userId,
        email: testUser.email,
        role: 'ADMINGERAL' as any,
        branchId: branch.id,
      })

      await createTestOnboardingProgress(userId, {
        churchConfigured: true,
        branchesConfigured: true,
        settingsConfigured: true,
        completed: true,
      })

      const memberToken = await generateTestToken(app, {
        sub: userId,
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`.trim(),
        type: 'member',
        memberId: member.id,
        branchId: branch.id,
        role: member.role,
        churchId: church.id,
        permissions: [],
        onboardingCompleted: true,
      })

      // When: POST /onboarding/complete novamente
      const response = await request(app.server)
        .post('/onboarding/complete')
        .set('Authorization', `Bearer ${memberToken}`)

      // Then: Retorna 200 e continua marcado como completo
      expect(response.status).toBe(200)
      expect(response.body.completed).toBe(true)

      // Verificar no banco
      const progress = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })
      expect(progress?.completed).toBe(true)
    })

    // Teste 6: 422 Business rule (não aplicável)
    // Pulado - não há validação de regras de negócio específicas

    // Teste 7: DB side-effect assertions
    it('deve atualizar completed e completedAt no banco', async () => {
      // Given: Progresso quase completo sem completedAt
      const userId = testUser.id
      const church = await createTestChurch({
        name: 'Test Church',
        createdByUserId: userId,
      })
      const branch = await createTestBranch({
        churchId: church.id,
        name: 'Sede',
        isMainBranch: true,
      })
      const member = await createTestMember({
        userId: userId,
        email: testUser.email,
        role: 'ADMINGERAL' as any,
        branchId: branch.id,
      })

      await createTestOnboardingProgress(userId, {
        churchConfigured: true,
        branchesConfigured: true,
        settingsConfigured: true,
        completed: false,
        completedAt: null,
      })

      const memberToken = await generateTestToken(app, {
        sub: userId,
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`.trim(),
        type: 'member',
        memberId: member.id,
        branchId: branch.id,
        role: member.role,
        churchId: church.id,
        permissions: [],
        onboardingCompleted: false,
      })

      const beforeTime = new Date()

      // When: POST /onboarding/complete
      const response = await request(app.server)
        .post('/onboarding/complete')
        .set('Authorization', `Bearer ${memberToken}`)

      const afterTime = new Date()

      expect(response.status).toBe(200)

      // Then: Banco atualizado com completed=true e completedAt preenchido
      const progress = await prisma.onboardingProgress.findUnique({
        where: { userId },
      })

      expect(progress?.completed).toBe(true)
      expect(progress?.completedAt).not.toBeNull()
      expect(new Date(progress!.completedAt!).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(new Date(progress!.completedAt!).getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })
})

