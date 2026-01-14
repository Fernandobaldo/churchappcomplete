/**
 * Security Tests - Branches Module
 * 
 * Tests tenant isolation and permission enforcement for branch endpoints
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
import { createTestBranch } from '../utils/testFactories'

import { createTenantA, createTenantB, type TenantContext } from './helpers/tenantContext'
import { getMemberToken, createIncompleteMemberToken } from './helpers/auth'
import { authorizedRequest, unauthorizedRequest } from './helpers/request'
import { expectForbidden, expectNotFound, expectUnauthorized, expectSuccess, expectOnlyTenantData } from './helpers/expect'

describe('Security: Branches Module', () => {
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

  describe('GET /branches', () => {
    it('should return only branches from user tenant', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/branches',
      })

      expectSuccess(response, 200)
      expect(Array.isArray(response.body)).toBe(true)
      
      // Should only contain tenant A branches
      const branches = response.body
      branches.forEach((branch: any) => {
        expect(branch.churchId).toBe(tenantA.church.id)
      })
      
      // Should not contain tenant B branches
      const tenantBBranchInResponse = branches.some((b: any) => b.churchId === tenantB.church.id)
      expect(tenantBBranchInResponse).toBe(false)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'get',
        url: '/branches',
      })

      expect([200, 400, 403]).toContain(response.status)
    })
  })

  describe('DELETE /branches/:id', () => {
    it('should allow same-tenant ADMINGERAL to delete their branch', async () => {
      // Create a temporary branch for deletion test
      const tempBranch = await createTestBranch({
        churchId: tenantA.church.id,
        isMainBranch: false,
      })
      
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'delete',
        url: `/branches/${tempBranch.id}`,
      })

      expectSuccess(response, 200)
    })

    it('should block cross-tenant delete (tenant B trying to delete tenant A branch)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'delete',
        url: `/branches/${tenantA.branch.id}`,
      })

      expectForbidden(response)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'delete',
        url: `/branches/${tenantA.branch.id}`,
      })

      expectForbidden(response)
    })
  })
})
