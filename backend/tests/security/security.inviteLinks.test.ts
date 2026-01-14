/**
 * Security Tests - Invite Links Module
 * 
 * Tests tenant isolation and permission enforcement for invite link endpoints
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

import { createTenantA, createTenantB, type TenantContext } from './helpers/tenantContext'
import { getMemberToken, createIncompleteMemberToken } from './helpers/auth'
import { authorizedRequest, unauthorizedRequest } from './helpers/request'
import { expectForbidden, expectNotFound, expectUnauthorized, expectSuccess } from './helpers/expect'
import { createInviteLink } from './helpers/factories'

describe('Security: Invite Links Module', () => {
  let app: FastifyInstance
  let tenantA: TenantContext
  let tenantB: TenantContext
  let tenantAInviteLink: any
  let tenantBInviteLink: any

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
    tenantB = await createTenantB()

    // Create invite links with unique tokens
    tenantAInviteLink = await createInviteLink({
      branchId: tenantA.branch.id,
      createdBy: tenantA.user.id,
      token: `tenant-a-token-${Date.now()}`,
    })
    tenantBInviteLink = await createInviteLink({
      branchId: tenantB.branch.id,
      createdBy: tenantB.user.id,
      token: `tenant-b-token-${Date.now()}`,
    })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('POST /invite-links', () => {
    it('should allow same-tenant user with permission to create invite link', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: '/invite-links',
        body: {
          branchId: tenantA.branch.id,
          maxUses: 10,
        },
      })

      expectSuccess(response, 201)
      expect(response.body.branchId).toBe(tenantA.branch.id)
    })

    it('should block cross-tenant invite link creation (tenant B trying to create for tenant A branch)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: '/invite-links',
        body: {
          branchId: tenantA.branch.id, // Trying to create link for tenant A branch
          maxUses: 10,
        },
      })

      expectForbidden(response)
    })

    it('should ignore branchId from body and use token branchId', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: '/invite-links',
        body: {
          branchId: tenantB.branch.id, // Trying to pass tenant B branchId
          maxUses: 10,
        },
      })

      // Should either reject or use tenant A branchId from token
      expect([201, 403]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body.branchId).toBe(tenantA.branch.id)
      }
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: '/invite-links',
        body: {
          branchId: tenantA.branch.id,
          maxUses: 10,
        },
      })

      expect([400, 401, 403]).toContain(response.status)
    })
  })

  describe('GET /invite-links/branch/:branchId', () => {
    it('should return only invite links from user tenant', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/invite-links/branch/${tenantA.branch.id}`,
      })

      expectSuccess(response, 200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // Should only contain tenant A invite links
      const links = response.body
      links.forEach((link: any) => {
        expect(link.branchId).toBe(tenantA.branch.id)
      })
    })

    it('should block cross-tenant access (tenant B trying to access tenant A branch links)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/invite-links/branch/${tenantA.branch.id}`,
      })

      expectForbidden(response)
    })
  })

  describe('PATCH /invite-links/:id/deactivate', () => {
    it('should block cross-tenant deactivation', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'patch',
        url: `/invite-links/${tenantAInviteLink.id}/deactivate`,
      })

      expectForbidden(response)
    })
  })

  describe('Public Endpoints', () => {
    describe('GET /public/invite-links/:token/info', () => {
      it('should return public info for valid token', async () => {
        const response = await unauthorizedRequest(app, {
          method: 'get',
          url: `/public/invite-links/${tenantAInviteLink.token}/info`,
        })

        expectSuccess(response, 200)
        expect(response.body).toHaveProperty('branchName')
        expect(response.body).toHaveProperty('churchName')
        // Should not return sensitive data
        expect(response.body).not.toHaveProperty('createdBy')
        expect(response.body).not.toHaveProperty('currentUses')
      })

      it('should return 404 for invalid token', async () => {
        const response = await unauthorizedRequest(app, {
          method: 'get',
          url: '/public/invite-links/invalid-token/info',
        })

        expectNotFound(response)
      })
    })
  })
})
