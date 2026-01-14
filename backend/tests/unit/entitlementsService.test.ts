/**
 * Unit tests for entitlementsService
 * 
 * Tests the logic for resolving user entitlements based on subscriptions and plans.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getEntitlements, hasFeature, userHasFeature } from '../../src/services/entitlementsService'
import { prisma } from '../../src/lib/prisma'
import { SubscriptionStatus } from '@prisma/client'

// Mock Prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
  },
}))

describe('entitlementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEntitlements', () => {
    it('should return entitlements from user active subscription', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        Subscription: [
          {
            id: 'sub-1',
            status: SubscriptionStatus.active,
            Plan: {
              id: 'plan-1',
              name: 'premium',
              code: 'PREMIUM',
              features: ['events', 'members', 'finances'],
              maxMembers: 100,
              maxBranches: 5,
            },
          },
        ],
        Member: null,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const entitlements = await getEntitlements('user-1')

      expect(entitlements).toEqual({
        features: ['events', 'members', 'finances'],
        limits: {
          maxMembers: 100,
          maxBranches: 5,
        },
        plan: {
          id: 'plan-1',
          name: 'premium',
          code: 'PREMIUM',
        },
        hasActiveSubscription: true,
        resolvedFrom: 'self',
      })
    })

    it('should return empty entitlements if user has no subscription', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        Subscription: [],
        Member: null,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const entitlements = await getEntitlements('user-1')

      expect(entitlements).toEqual({
        features: [],
        limits: {
          maxMembers: null,
          maxBranches: null,
        },
        plan: null,
        hasActiveSubscription: false,
        resolvedFrom: null,
      })
    })

    it('should fallback to ADMINGERAL subscription if user has no subscription but is a member', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        Subscription: [],
        Member: {
          id: 'member-1',
          Branch: {
            churchId: 'church-1',
          },
        },
      }

      const mockAdminMember = {
        id: 'admin-member-1',
        role: 'ADMINGERAL',
        User: {
          id: 'admin-user-1',
          Subscription: [
            {
              id: 'admin-sub-1',
              status: SubscriptionStatus.active,
              Plan: {
                id: 'plan-1',
                name: 'premium',
                code: 'PREMIUM',
                features: ['events', 'members', 'finances'],
                maxMembers: 100,
                maxBranches: 5,
              },
            },
          ],
        },
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.member.findFirst).mockResolvedValue(mockAdminMember as any)

      const entitlements = await getEntitlements('user-1')

      expect(entitlements).toEqual({
        features: ['events', 'members', 'finances'],
        limits: {
          maxMembers: 100,
          maxBranches: 5,
        },
        plan: {
          id: 'plan-1',
          name: 'premium',
          code: 'PREMIUM',
        },
        hasActiveSubscription: true,
        resolvedFrom: 'admingeral',
      })
    })

    it('should filter out invalid features', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        Subscription: [
          {
            id: 'sub-1',
            status: SubscriptionStatus.active,
            Plan: {
              id: 'plan-1',
              name: 'premium',
              code: 'PREMIUM',
              features: ['events', 'invalid_feature', 'finances'], // invalid_feature should be filtered
              maxMembers: 100,
              maxBranches: 5,
            },
          },
        ],
        Member: null,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const entitlements = await getEntitlements('user-1')

      // Invalid feature should be filtered out
      expect(entitlements.features).toEqual(['events', 'finances'])
      expect(entitlements.features).not.toContain('invalid_feature')
    })
  })

  describe('hasFeature', () => {
    it('should return true if feature is in entitlements', () => {
      const entitlements = {
        features: ['events', 'members', 'finances'],
        limits: { maxMembers: 100, maxBranches: 5 },
        plan: { id: 'plan-1', name: 'premium', code: 'PREMIUM' },
        hasActiveSubscription: true,
        resolvedFrom: 'self' as const,
      }

      expect(hasFeature(entitlements, 'finances')).toBe(true)
    })

    it('should return false if feature is not in entitlements', () => {
      const entitlements = {
        features: ['events', 'members'],
        limits: { maxMembers: 100, maxBranches: 5 },
        plan: { id: 'plan-1', name: 'free', code: 'FREE' },
        hasActiveSubscription: true,
        resolvedFrom: 'self' as const,
      }

      expect(hasFeature(entitlements, 'finances')).toBe(false)
    })
  })
})
