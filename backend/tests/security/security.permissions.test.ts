/**
 * Security Tests - Permissions Module
 * 
 * Tests tenant isolation and permission enforcement for permission endpoints
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
import { expectForbidden, expectUnauthorized, expectSuccess } from './helpers/expect'

describe('Security: Permissions Module', () => {
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

  describe('POST /permissions/:id', () => {
    it('should allow same-tenant ADMINGERAL to assign permissions to their member', async () => {
      const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: `/permissions/${tenantA.members.member.id}`,
        body: {
          permissions: ['members_view'],
        },
      })

      expectSuccess(response, 200)
    })

    it('should block cross-tenant permission assignment (tenant B trying to assign to tenant A member)', async () => {
      const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: `/permissions/${tenantA.members.member.id}`,
        body: {
          permissions: ['members_manage'],
        },
      })

      expectForbidden(response)
    })

    it('should block user without ADMINGERAL/ADMINFILIAL role', async () => {
      const token = await getMemberToken(tenantA.members.member.id, { includePermissions: true })
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: `/permissions/${tenantA.members.coordinator.id}`,
        body: {
          permissions: ['members_view'],
        },
      })

      expectForbidden(response)
    })

    it('should block incomplete member', async () => {
      const token = await createIncompleteMemberToken(tenantA.user.id)
      
      const response = await authorizedRequest(app, {
        token,
        method: 'post',
        url: `/permissions/${tenantA.members.member.id}`,
        body: {
          permissions: ['members_view'],
        },
      })

      expectForbidden(response)
    })
  })
})
