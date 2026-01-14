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
  createTestSubscription,
} from '../utils/testFactories'
import type { FastifyInstance } from 'fastify'
import { SubscriptionStatus } from '@prisma/client'

describe('GET /subscriptions/entitlements - Integration Tests', () => {
  let app: FastifyInstance
  let freePlanId: string
  let premiumPlanId: string

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()
  })

  beforeEach(async () => {
    await resetTestDatabase()

    // Criar planos de teste
    const freePlan = await createTestPlan({
      name: 'free',
      code: 'FREE',
      price: 0,
      features: ['events', 'members', 'contributions', 'devotionals'],
      maxMembers: 20,
      maxBranches: 1,
    })
    freePlanId = freePlan.id

    const premiumPlan = await createTestPlan({
      name: 'premium',
      code: 'PREMIUM',
      price: 99,
      features: ['events', 'members', 'contributions', 'devotionals', 'finances', 'advanced_reports'],
      maxMembers: 100,
      maxBranches: 5,
    })
    premiumPlanId = premiumPlan.id
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('Autenticação', () => {
    it('deve retornar 401 quando não autenticado', async () => {
      const response = await request(app.server).get('/subscriptions/entitlements')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('deve retornar 401 quando token inválido', async () => {
      const response = await request(app.server)
        .get('/subscriptions/entitlements')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
    })
  })

  describe('Entitlements do próprio usuário', () => {
    it('deve retornar 200 com entitlements quando usuário tem subscription ativa', async () => {
      // Given: User com subscription ativa
      const user = await createTestUser({
        email: `user-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      })

      await createTestSubscription(user.id, premiumPlanId, SubscriptionStatus.active)

      const token = generateTestToken({
        userId: user.id,
        email: user.email,
        type: 'user',
      })

      // When: GET /subscriptions/entitlements
      const response = await request(app.server)
        .get('/subscriptions/entitlements')
        .set('Authorization', `Bearer ${token}`)

      // Then: Retorna 200 com payload completo
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('features')
      expect(response.body).toHaveProperty('limits')
      expect(response.body).toHaveProperty('plan')
      expect(response.body).toHaveProperty('hasActiveSubscription')
      expect(response.body).toHaveProperty('resolvedFrom')

      // Validar estrutura do payload
      expect(Array.isArray(response.body.features)).toBe(true)
      expect(response.body.features).toContain('finances')
      expect(response.body.features).toContain('advanced_reports')

      expect(response.body.limits).toHaveProperty('maxMembers')
      expect(response.body.limits).toHaveProperty('maxBranches')
      expect(response.body.limits.maxMembers).toBe(100)
      expect(response.body.limits.maxBranches).toBe(5)

      expect(response.body.plan).toHaveProperty('id')
      expect(response.body.plan).toHaveProperty('name')
      expect(response.body.plan.name).toBe('premium')
      expect(response.body.plan.code).toBe('PREMIUM')

      expect(response.body.hasActiveSubscription).toBe(true)
      expect(response.body.resolvedFrom).toBe('self')
    })

    it('deve retornar entitlements do plano free quando usuário tem subscription free', async () => {
      // Given: User com subscription free
      const user = await createTestUser({
        email: `user-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      })

      await createTestSubscription(user.id, freePlanId, SubscriptionStatus.active)

      const token = generateTestToken({
        userId: user.id,
        email: user.email,
        type: 'user',
      })

      // When: GET /subscriptions/entitlements
      const response = await request(app.server)
        .get('/subscriptions/entitlements')
        .set('Authorization', `Bearer ${token}`)

      // Then: Retorna entitlements do plano free
      expect(response.status).toBe(200)
      expect(response.body.features).not.toContain('finances')
      expect(response.body.features).not.toContain('advanced_reports')
      expect(response.body.limits.maxMembers).toBe(20)
      expect(response.body.limits.maxBranches).toBe(1)
      expect(response.body.plan.name).toBe('free')
      expect(response.body.resolvedFrom).toBe('self')
    })

    it('deve retornar entitlements vazios quando usuário não tem subscription', async () => {
      // Given: User sem subscription
      const user = await createTestUser({
        email: `user-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      })

      const token = generateTestToken({
        userId: user.id,
        email: user.email,
        type: 'user',
      })

      // When: GET /subscriptions/entitlements
      const response = await request(app.server)
        .get('/subscriptions/entitlements')
        .set('Authorization', `Bearer ${token}`)

      // Then: Retorna entitlements vazios
      expect(response.status).toBe(200)
      expect(response.body.features).toEqual([])
      expect(response.body.limits.maxMembers).toBeNull()
      expect(response.body.limits.maxBranches).toBeNull()
      expect(response.body.plan).toBeNull()
      expect(response.body.hasActiveSubscription).toBe(false)
      expect(response.body.resolvedFrom).toBeNull()
    })
  })

  describe('Fallback para ADMINGERAL', () => {
    it('deve retornar entitlements do ADMINGERAL quando usuário não tem subscription mas é member', async () => {
      // Given: ADMINGERAL com subscription premium
      const adminUser = await createTestUser({
        email: `admin-${Date.now()}@test.com`,
        firstName: 'Admin',
        lastName: 'User',
        password: 'password123',
      })

      await createTestSubscription(adminUser.id, premiumPlanId, SubscriptionStatus.active)

      const church = await createTestChurch({
        name: 'Test Church',
        createdByUserId: adminUser.id,
      })

      const branch = await createTestBranch({
        churchId: church.id,
        name: 'Sede',
        isMainBranch: true,
      })

      await createTestMember({
        userId: adminUser.id,
        email: adminUser.email,
        role: 'ADMINGERAL' as any,
        branchId: branch.id,
      })

      // Given: Member sem subscription
      const memberUser = await createTestUser({
        email: `member-${Date.now()}@test.com`,
        firstName: 'Member',
        lastName: 'User',
        password: 'password123',
      })

      await createTestMember({
        userId: memberUser.id,
        email: memberUser.email,
        role: 'MEMBER' as any,
        branchId: branch.id,
      })

      const token = generateTestToken({
        userId: memberUser.id,
        email: memberUser.email,
        type: 'user',
      })

      // When: GET /subscriptions/entitlements
      const response = await request(app.server)
        .get('/subscriptions/entitlements')
        .set('Authorization', `Bearer ${token}`)

      // Then: Retorna entitlements do ADMINGERAL (fallback)
      expect(response.status).toBe(200)
      expect(response.body.features).toContain('finances')
      expect(response.body.features).toContain('advanced_reports')
      expect(response.body.limits.maxMembers).toBe(100)
      expect(response.body.limits.maxBranches).toBe(5)
      expect(response.body.plan.name).toBe('premium')
      expect(response.body.hasActiveSubscription).toBe(true)
      expect(response.body.resolvedFrom).toBe('admingeral')
    })
  })

  describe('Segurança - Não vazar dados sensíveis', () => {
    it('não deve incluir dados sensíveis do plano (gateway IDs, etc)', async () => {
      // Given: User com subscription
      const user = await createTestUser({
        email: `user-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      })

      await createTestSubscription(user.id, premiumPlanId, SubscriptionStatus.active)

      const token = generateTestToken({
        userId: user.id,
        email: user.email,
        type: 'user',
      })

      // When: GET /subscriptions/entitlements
      const response = await request(app.server)
        .get('/subscriptions/entitlements')
        .set('Authorization', `Bearer ${token}`)

      // Then: Não inclui dados sensíveis
      expect(response.status).toBe(200)
      expect(response.body).not.toHaveProperty('gatewayProvider')
      expect(response.body).not.toHaveProperty('gatewayProductId')
      expect(response.body).not.toHaveProperty('gatewayPriceId')
      expect(response.body).not.toHaveProperty('price')
      expect(response.body).not.toHaveProperty('billingInterval')
      expect(response.body).not.toHaveProperty('syncStatus')
    })
  })
})
