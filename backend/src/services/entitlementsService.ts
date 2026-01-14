/**
 * ENTITLEMENTS RESOLUTION SERVICE
 * 
 * Centralized logic for determining what a tenant/user can do based on their subscription and plan.
 * 
 * This is a pure logic layer - no HTTP concerns, reusable in guards and tests.
 * 
 * Key principles:
 * - Subscription is per User (not per Church)
 * - Limits (maxMembers, maxBranches) are applied per Church
 * - Features are determined by the User's active subscription
 * - If User has no subscription, fallback to ADMINGERAL's subscription
 */

import { prisma } from '../lib/prisma'
import { SubscriptionStatus, User, Member, Subscription, Plan } from '@prisma/client'
import { PlanFeatureId, getAllFeatureIds } from '../constants/planFeatures'

/**
 * Context for entitlements resolution
 */
export interface EntitlementsContext {
  user: User & {
    Member?: (Member & {
      Branch?: {
        churchId: string
      } | null
    }) | null
  }
  subscription?: Subscription & {
    Plan: Plan
  } | null
  member?: Member & {
    Branch?: {
      churchId: string
    } | null
  } | null
}

/**
 * Resolved entitlements for a user/tenant
 */
export interface Entitlements {
  /**
   * Features available to this user based on their plan
   */
  features: PlanFeatureId[]
  
  /**
   * Limits from the plan
   */
  limits: {
    maxMembers: number | null
    maxBranches: number | null
  }
  
  /**
   * Metadata about the plan
   */
  plan: {
    id: string
    name: string
    code: string | null
  } | null
  
  /**
   * Whether the user has an active subscription
   */
  hasActiveSubscription: boolean
  
  /**
   * Source of the entitlements resolution
   * - 'self': From user's own subscription
   * - 'admingeral': From ADMINGERAL's subscription (fallback)
   */
  resolvedFrom: 'self' | 'admingeral' | null
}

/**
 * Get entitlements for a user
 * 
 * This function:
 * 1. Finds the user's active subscription
 * 2. If no subscription, falls back to ADMINGERAL's subscription (if user is a member)
 * 3. Returns features and limits from the plan
 * 
 * @param userId - User ID
 * @returns Entitlements object
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  // 1. Load user with member and subscription data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Subscription: {
        where: { status: SubscriptionStatus.active },
        include: { Plan: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
      Member: {
        include: {
          Branch: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  let plan: Plan | null = null
  let subscription: (Subscription & { Plan: Plan }) | null = null
  let resolvedFrom: 'self' | 'admingeral' | null = null

  // 2. Try to get plan from user's active subscription
  if (user.Subscription.length > 0) {
    subscription = user.Subscription[0] as Subscription & { Plan: Plan }
    plan = subscription.Plan
    resolvedFrom = 'self'
  }

  // 3. Fallback: If user has no subscription but is a member, use ADMINGERAL's plan
  if (!plan && user.Member?.Branch?.churchId) {
    const churchId = user.Member.Branch.churchId
    
    const adminMember = await prisma.member.findFirst({
      where: {
        Branch: {
          churchId,
        },
        role: 'ADMINGERAL',
      },
      include: {
        User: {
          include: {
            Subscription: {
              where: { status: SubscriptionStatus.active },
              include: { Plan: true },
              orderBy: { startedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    if (adminMember?.User?.Subscription.length > 0) {
      subscription = adminMember.User.Subscription[0] as Subscription & { Plan: Plan }
      plan = subscription.Plan
      resolvedFrom = 'admingeral'
    }
  }

  // 4. If still no plan, return empty entitlements (user has no plan)
  if (!plan) {
    return {
      features: [],
      limits: {
        maxMembers: null,
        maxBranches: null,
      },
      plan: null,
      hasActiveSubscription: false,
      resolvedFrom: null,
    }
  }

  // 5. Extract features (ensure they're valid PlanFeatureIds)
  // Filter out any invalid features that might have been stored in the DB
  const validFeatureIds = getAllFeatureIds()
  const features = (plan.features || []).filter((f): f is PlanFeatureId =>
    validFeatureIds.includes(f as PlanFeatureId)
  )

  return {
    features,
    limits: {
      maxMembers: plan.maxMembers,
      maxBranches: plan.maxBranches,
    },
    plan: {
      id: plan.id,
      name: plan.name,
      code: plan.code,
    },
    hasActiveSubscription: true,
    resolvedFrom,
  }
}

/**
 * Check if entitlements include a specific feature
 * 
 * @param entitlements - Entitlements object
 * @param featureId - Feature ID to check
 * @returns true if feature is available
 */
export function hasFeature(
  entitlements: Entitlements,
  featureId: PlanFeatureId
): boolean {
  return entitlements.features.includes(featureId)
}

/**
 * Get entitlements and check for a feature (convenience function)
 * 
 * @param userId - User ID
 * @param featureId - Feature ID to check
 * @returns true if user has the feature
 */
export async function userHasFeature(
  userId: string,
  featureId: PlanFeatureId
): Promise<boolean> {
  const entitlements = await getEntitlements(userId)
  return hasFeature(entitlements, featureId)
}
