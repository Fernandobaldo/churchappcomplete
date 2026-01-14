/**
 * Security Tests - Members Module
 * 
 * Tests tenant isolation and permission enforcement for member endpoints
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

describe('Security: Members Module', () => {
  let app: FastifyInstance
  let tenantA: TenantContext
  let tenantB: TenantContext

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
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  describe('GET /members', () => {
    it('should return only members from user tenant', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/members',
      })

      expectSuccess(response, 200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // Should only contain tenant A members
      const members = response.body
      const tenantAMemberIds = Object.values(tenantA.members).map(m => m.id)
      const tenantBMemberIds = Object.values(tenantB.members).map(m => m.id)
      
      members.forEach((member: any) => {
        expect(tenantAMemberIds).toContain(member.id)
      })
      
      // Should not contain tenant B members
      members.forEach((member: any) => {
        expect(tenantBMemberIds).not.toContain(member.id)
      })
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/members',
      })

      expect([401, 403, 404]).toContain(response.status)
    })
  })

  describe('GET /members/:id', () => {
    it('should allow same-tenant user to access their member', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/members/${tenantA.members.member.id}`,
      })

      expectSuccess(response, 200)
      expect(response.body.id).toBe(tenantA.members.member.id)
    })

    it('should block cross-tenant access (tenant B trying to access tenant A member)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/members/${tenantA.members.member.id}`,
      })

      expectForbidden(response)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: `/members/${tenantA.members.member.id}`,
      })

      expectForbidden(response)
    })
  })

  describe('PUT /members/:id', () => {
    it('should allow same-tenant user with permission to update member', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/members/${tenantA.members.member.id}`,
        body: {
          name: 'Updated Member Name',
        },
      })

      expectSuccess(response, 200)
    })

    it('should block cross-tenant update (tenant B trying to update tenant A member)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/members/${tenantA.members.member.id}`,
        body: {
          name: 'Hacked Name',
        },
      })

      expectForbidden(response)
    })

    it('should block user without members_manage permission', async () => {
      const token = await getMemberToken(tenantA.members.member.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/members/${tenantA.members.coordinator.id}`,
        body: {
          name: 'Updated Name',
        },
      })

      expectForbidden(response)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'put',
        url: `/members/${tenantA.members.member.id}`,
        body: {
          name: 'Updated Name',
        },
      })

      expectForbidden(response)
    })
  })
})
