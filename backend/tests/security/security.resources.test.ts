/**
 * Security Tests - Resource Modules (Events, Devotionals, Contributions, Finances, Notices)
 * 
 * Tests tenant isolation and permission enforcement for resource endpoints
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
import { TransactionType, EntryType } from '@prisma/client'

import { createTenantA, createTenantB, type TenantContext } from './helpers/tenantContext'
import { getMemberToken, createIncompleteMemberToken } from './helpers/auth'
import { authorizedRequest, unauthorizedRequest } from './helpers/request'
import { expectForbidden, expectNotFound, expectUnauthorized, expectSuccess, expectOnlyTenantData } from './helpers/expect'
import { createEvent, createDevotional, createContribution, createTransaction, createNotice } from './helpers/factories'

describe('Security: Resource Modules', () => {
  let app: FastifyInstance
  let tenantA: TenantContext
  let tenantB: TenantContext
  let tenantAEvent: any
  let tenantBEvent: any
  let tenantADevotional: any
  let tenantBDevotional: any
  let tenantAContribution: any
  let tenantBContribution: any
  let tenantATransaction: any
  let tenantBTransaction: any
  let tenantANotice: any
  let tenantBNotice: any

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

    // Create test resources
    tenantAEvent = await createEvent({ branchId: tenantA.branch.id })
    tenantBEvent = await createEvent({ branchId: tenantB.branch.id })
    
    tenantADevotional = await createDevotional({
      branchId: tenantA.branch.id,
      authorId: tenantA.members.adminGeral.id,
    })
    tenantBDevotional = await createDevotional({
      branchId: tenantB.branch.id,
      authorId: tenantB.members.adminGeral.id,
    })
    
    tenantAContribution = await createContribution({ branchId: tenantA.branch.id })
    tenantBContribution = await createContribution({ branchId: tenantB.branch.id })
    
    tenantATransaction = await createTransaction({
      branchId: tenantA.branch.id,
      amount: 1000,
      type: TransactionType.ENTRY,
      entryType: EntryType.OFFERING,
    })
    tenantBTransaction = await createTransaction({
      branchId: tenantB.branch.id,
      amount: 2000,
      type: TransactionType.ENTRY,
      entryType: EntryType.OFFERING,
    })
    
    tenantANotice = await createNotice({ branchId: tenantA.branch.id })
    tenantBNotice = await createNotice({ branchId: tenantB.branch.id })
  })

  afterAll(async () => {
    await resetTestDatabase()
    await app.close()
  })

  // ========== EVENTS ==========
  describe('Events Module', () => {
    describe('GET /events', () => {
      it('should return only events from user tenant', async () => {
        const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: '/events',
        })

        expectSuccess(response, 200)
        expectOnlyTenantData(response, tenantA.branch.id)
      })

      it('should block incomplete member', async () => {
        const token = await createIncompleteMemberToken(tenantA.user.id)
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: '/events',
        })

        expect([400, 403]).toContain(response.status)
      })
    })

    describe('GET /events/:id', () => {
      it('should allow same-tenant user to access their event', async () => {
        const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: `/events/${tenantAEvent.id}`,
        })

        expectSuccess(response, 200)
        expect(response.body.id).toBe(tenantAEvent.id)
      })

      it('should block cross-tenant access', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: `/events/${tenantAEvent.id}`,
        })

        expect([403, 404]).toContain(response.status)
      })
    })

    describe('PUT /events/:id', () => {
      it('should block cross-tenant update', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'put',
          url: `/events/${tenantAEvent.id}`,
          body: {
            title: 'Hacked Event',
          },
        })

        expect([403, 404]).toContain(response.status)
      })
    })

    describe('DELETE /events/:id', () => {
      it('should block cross-tenant delete', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'delete',
          url: `/events/${tenantAEvent.id}`,
        })

        expectForbidden(response)
      })
    })
  })

  // ========== DEVOTIONALS ==========
  describe('Devotionals Module', () => {
    describe('GET /devotionals', () => {
      it('should return only devotionals from user tenant', async () => {
        const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: '/devotionals',
        })

        expectSuccess(response, 200)
        expectOnlyTenantData(response, tenantA.branch.id)
      })
    })

    describe('GET /devotionals/:id', () => {
      it('should block cross-tenant access', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: `/devotionals/${tenantADevotional.id}`,
        })

        expect([403, 404]).toContain(response.status)
      })
    })

    describe('PUT /devotionals/:id', () => {
      it('should block cross-tenant update', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'put',
          url: `/devotionals/${tenantADevotional.id}`,
          body: {
            title: 'Hacked Devotional',
          },
        })

        expect([403, 404]).toContain(response.status)
      })
    })
  })

  // ========== CONTRIBUTIONS ==========
  describe('Contributions Module', () => {
    describe('GET /contributions', () => {
      it('should return only contributions from user tenant', async () => {
        const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: '/contributions',
        })

        expectSuccess(response, 200)
        expectOnlyTenantData(response, tenantA.branch.id)
      })
    })

    describe('GET /contributions/:id', () => {
      it('should block cross-tenant access', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: `/contributions/${tenantAContribution.id}`,
        })

        expectForbidden(response)
      })
    })

    describe('PUT /contributions/:id', () => {
      it('should block cross-tenant update', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'put',
          url: `/contributions/${tenantAContribution.id}`,
          body: {
            title: 'Hacked Contribution',
          },
        })

        expectForbidden(response)
      })
    })
  })

  // ========== FINANCES ==========
  describe('Finances Module', () => {
    describe('GET /finances', () => {
      it('should return only transactions from user tenant', async () => {
        const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: '/finances',
        })

        expectSuccess(response, 200)
        if (response.body.transactions) {
          expectOnlyTenantData({ body: response.body.transactions }, tenantA.branch.id)
        }
      })
    })

    describe('GET /finances/:id', () => {
      it('should block cross-tenant access', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: `/finances/${tenantATransaction.id}`,
        })

        expectNotFound(response)
      })
    })

    describe('PUT /finances/:id', () => {
      it('should block cross-tenant update', async () => {
        const token = await getMemberToken(tenantB.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'put',
          url: `/finances/${tenantATransaction.id}`,
          body: {
            amount: 9999,
          },
        })

        expectNotFound(response)
      })
    })
  })

  // ========== NOTICES ==========
  describe('Notices Module', () => {
    describe('GET /notices', () => {
      it('should return only notices from user tenant', async () => {
        const token = await getMemberToken(tenantA.members.adminGeral.id, { includePermissions: true })
        
        const response = await authorizedRequest(app, {
          token,
          method: 'get',
          url: '/notices',
        })

        expectSuccess(response, 200)
        expectOnlyTenantData(response, tenantA.branch.id)
      })
    })
  })
})
