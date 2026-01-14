/**
 * Security Tests - Onboarding Module
 * 
 * Tests tenant isolation for onboarding endpoints
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import '../setupTestEnv'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyInstance } from 'fastify'
import { createTestApp } from '../utils/createTestApp'
import { resetTestDatabase } from '../utils/resetTestDatabase'
import { prisma } from '../../src/lib/prisma'
import { createTestPlan } from '../utils/testFactories'

import { createTenantA, type TenantContext } from './helpers/tenantContext'
import { getMemberToken, createIncompleteMemberToken } from './helpers/auth'
import { authorizedRequest, unauthorizedRequest } from './helpers/request'
import { expectForbidden, expectUnauthorized, expectSuccess } from './helpers/expect'

describe('Security: Onboarding Module', () => {
  let app: FastifyInstance
  let tenantA: TenantContext

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()

    const existingPlan = await prisma.plan.findFirst({
      where: { name: { in: ['free', 'Free', 'Free Plan'] } },
    })

    if (!existingPlan) {
      await createTestPlan({
        name: 'free',
        price: 0,
        features: ['Até 1 igreja', 'Até 1 filial', 'Até 20 membros'],
        maxBranches: 1,
        maxMembers: 20,
      })
    }

    tenantA = await createTenantA()
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('GET /onboarding/state', () => {
    it('should allow authenticated user to access their own onboarding state', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/onboarding/state',
      })

      expectSuccess(response, 200)
      expect(response.body).toHaveProperty('userId')
    })

    it('should allow incomplete member to access their onboarding state', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/onboarding/state',
      })

      expectSuccess(response, 200)
    })

    it('should require authentication', async () => {
      const response = await unauthorizedRequest(app, {
        method: 'get',
        url: '/onboarding/state',
      })

      expectUnauthorized(response)
    })
  })

  describe('POST /onboarding/complete', () => {
    it('should allow authenticated user to complete their own onboarding', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: '/onboarding/complete',
      })

      expect([200, 201]).toContain(response.status)
    })

    it('should require authentication', async () => {
      const response = await unauthorizedRequest(app, {
        method: 'post',
        url: '/onboarding/complete',
      })

      expectUnauthorized(response)
    })
  })
})
