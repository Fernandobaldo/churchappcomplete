// Integration tests para prevenção de duplicação de igreja
// Padrão obrigatório: 7 testes por endpoint crítico
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../utils/createTestApp'
import { generateTestToken } from '../utils/auth'
import { createTestUser, createTestPlan, createTestSubscription, createTestChurch } from '../utils/testFactories'
import { resetTestDatabase } from '../utils/db'
import { prisma } from '../../src/lib/prisma'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'

describe('Church Creation - Prevenção de Duplicação - Integration Tests', () => {
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

    // Criar User
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
    await app.close()
    await resetTestDatabase()
  })

  describe('POST /churches - Prevenção de Duplicação', () => {
    // Teste 1: 200/201 Success - Primeira criação
    it('deve criar igreja na primeira tentativa (201 Created)', async () => {
      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Nova',
          branchName: 'Sede',
          withBranch: true,
        })

      expect(response.status).toBe(201)
      expect(response.body.church).toBeDefined()
      expect(response.body.church.id).toBeDefined()
      expect(response.body.branch).toBeDefined()
      expect(response.body.member).toBeDefined()
      expect(response.body.token).toBeDefined()

      // Verificar no banco
      const church = await prisma.church.findUnique({
        where: { id: response.body.church.id },
      })
      expect(church).not.toBeNull()
      expect(church?.createdByUserId).toBe(testUser.id)
    })

    // Teste 2: 400 Invalid payload
    it('deve retornar 400 se nome da igreja não fornecido', async () => {
      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          branchName: 'Sede',
        })

      expect(response.status).toBe(400)
    })

    // Teste 3: 401 Unauthenticated
    it('deve retornar 401 se usuário não autenticado', async () => {
      const response = await request(app.server).post('/churches').send({
        name: 'Igreja Nova',
      })

      expect(response.status).toBe(401)
    })

    // Teste 4: 403 Forbidden (não aplicável)
    // Pulado - não há verificação de role/permission específica

    // Teste 5: 409 Conflict/Idempotency - Prevenção de duplicação
    it('deve retornar igreja existente quando createdByUserId já existe (200 OK)', async () => {
      // Criar primeira igreja
      const response1 = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Teste',
          branchName: 'Sede',
          withBranch: true,
        })

      expect(response1.status).toBe(201)
      const churchId1 = response1.body.church.id

      // When: Tentar criar segunda igreja (mesmo usuário)
      const response2 = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Teste 2',
          branchName: 'Sede',
          withBranch: true,
        })

      // Then: Deve retornar igreja existente (200 OK, não 201 Created)
      expect(response2.status).toBe(200)
      expect(response2.body.church.id).toBe(churchId1)
      expect(response2.body.existing).toBe(true)

      // Verificar que não foi criada nova igreja no banco
      const churches = await prisma.church.findMany({
        where: { createdByUserId: testUser.id },
      })
      expect(churches.length).toBe(1)
    })

    // Teste 6: 422 Business rule - Criar Branch/Member se não existirem
    it('deve criar Branch/Member automaticamente se não existirem ao retornar igreja existente', async () => {
      // Given: Igreja existente sem branch/member
      const userId = testUser.id

      // Criar igreja diretamente no banco (sem branch/member)
      const church = await createTestChurch({
        name: 'Igreja Existente',
        createdByUserId: userId,
      })

      // Verificar que não existe branch/member
      const branchBefore = await prisma.branch.findFirst({
        where: { churchId: church.id },
      })
      const memberBefore = await prisma.member.findFirst({
        where: { userId },
      })
      expect(branchBefore).toBeNull()
      expect(memberBefore).toBeNull()

      // When: Tentar criar novamente (deve retornar existente e criar branch/member)
      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Existente',
          branchName: 'Sede',
          withBranch: true,
        })

      expect(response.status).toBe(200)
      expect(response.body.branch).toBeDefined()
      expect(response.body.member).toBeDefined()
      expect(response.body.token).toBeDefined()

      // Then: Branch/member foram criados no banco
      const branchAfter = await prisma.branch.findFirst({
        where: { churchId: church.id },
      })
      const memberAfter = await prisma.member.findFirst({
        where: { userId },
      })
      expect(branchAfter).not.toBeNull()
      expect(memberAfter).not.toBeNull()
    })

    // Teste 7: DB side-effect assertions - Token com onboardingCompleted
    it('deve retornar token com onboardingCompleted correto', async () => {
      // Given: Progresso de onboarding criado
      const userId = testUser.id

      await prisma.onboardingProgress.create({
        data: {
          userId,
          churchConfigured: true,
          branchesConfigured: false,
          settingsConfigured: false,
          completed: false,
        },
      })

      // When: POST /churches
      const response = await request(app.server)
        .post('/churches')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Igreja Nova',
          branchName: 'Sede',
          withBranch: true,
        })

      expect(response.status).toBe(201)
      expect(response.body.token).toBeDefined()

      // Then: Token inclui onboardingCompleted e dados do member
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(response.body.token)
      expect(decoded.onboardingCompleted).toBe(false) // Ainda não completo
      expect(decoded.memberId).toBeDefined()
      expect(decoded.branchId).toBeDefined()
      expect(decoded.role).toBeDefined()
    })
  })
})

