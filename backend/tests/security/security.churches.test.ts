/**
 * Security Tests - Churches Module
 * 
 * Tests tenant isolation and permission enforcement for church endpoints
 */

// IMPORTANT: Load .env.test BEFORE any imports
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

// Security test helpers
import { createTenantA, createTenantB, type TenantContext } from './helpers/tenantContext'
import { getMemberToken, createIncompleteMemberToken } from './helpers/auth'
import { authorizedRequest, unauthorizedRequest } from './helpers/request'
import { expectForbidden, expectNotFound, expectUnauthorized, expectSuccess, expectOnlyTenantData } from './helpers/expect'

describe('Security: Churches Module', () => {
  let app: FastifyInstance
  let tenantA: TenantContext
  let tenantB: TenantContext

  beforeAll(async () => {
    app = await createTestApp()
    await resetTestDatabase()

    // Create free plan (required for church creation)
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

    // Create tenants
    tenantA = await createTenantA()
    tenantB = await createTenantB()
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('GET /churches/:id', () => {
    it('should allow same-tenant user to access their church', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/churches/${tenantA.church.id}`,
      })

      expectSuccess(response, 200)
      expect(response.body.id).toBe(tenantA.church.id)
      expect(response.body.name).toBe(tenantA.church.name)
    })

    it('should block cross-tenant access (tenant B trying to access tenant A church)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/churches/${tenantA.church.id}`,
      })

      expectForbidden(response)
    })

    it('should block incomplete member (user without branchId/churchId)', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/churches/${tenantA.church.id}`,
      })

      expectForbidden(response)
    })

    it('should require authentication', async () => {
      const response = await unauthorizedRequest(app, {
        method: 'get',
        url: `/churches/${tenantA.church.id}`,
      })

      expectUnauthorized(response)
    })
  })

  describe('GET /churches', () => {
    it('should return only churches from user tenant', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/churches',
      })

      expectSuccess(response, 200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // Should only contain tenant A church
      const churches = response.body
      expect(churches.length).toBeGreaterThan(0)
      churches.forEach((church: any) => {
        expect(church.id).toBe(tenantA.church.id)
      })
      
      // Should not contain tenant B church
      const tenantBChurchInResponse = churches.some((c: any) => c.id === tenantB.church.id)
      expect(tenantBChurchInResponse).toBe(false)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/churches',
      })

      // May return empty array or 403 depending on implementation
      expect([200, 403]).toContain(response.status)
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true)
        expect(response.body.length).toBe(0)
      }
    })
  })

  describe('PUT /churches/:id', () => {
    it('should allow same-tenant ADMINGERAL to update their church', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/churches/${tenantA.church.id}`,
        body: {
          name: 'Updated Church Name',
        },
      })

      expectSuccess(response, 200)
      expect(response.body.name).toBe('Updated Church Name')
    })

    it('should block cross-tenant update (tenant B trying to update tenant A church)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/churches/${tenantA.church.id}`,
        body: {
          name: 'Hacked Church Name',
        },
      })

      expectForbidden(response)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/churches/${tenantA.church.id}`,
        body: {
          name: 'Updated Name',
        },
      })

      expectForbidden(response)
    })
  })

  describe('DELETE /churches/:id', () => {
    it('should allow same-tenant ADMINGERAL to delete their church', async () => {
      // Create a temporary church for deletion test
      const tempTenant = await createTenantA()
      const token = await getMemberToken(tempTenant.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'delete',
        url: `/churches/${tempTenant.church.id}`,
      })

      expectSuccess(response, 200)
    })

    it('should block cross-tenant delete (tenant B trying to delete tenant A church)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'delete',
        url: `/churches/${tenantA.church.id}`,
      })

      expectForbidden(response)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'delete',
        url: `/churches/${tenantA.church.id}`,
      })

      expectForbidden(response)
    })
  })
})
