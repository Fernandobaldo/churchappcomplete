/**
 * REQUIRE FEATURE MIDDLEWARE
 * 
 * Authorization guard that enforces plan feature requirements.
 * 
 * Usage:
 *   app.get('/finances', {
 *     preHandler: [authenticate, requireFeature('finances')],
 *     handler: getFinancesHandler
 *   })
 * 
 * Important:
 * - This middleware MUST be used AFTER authenticate
 * - Tenant isolation (multi-tenancy) should be enforced separately
 * - Returns 403 if feature is not available in the user's plan
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { PlanFeatureId } from '../constants/planFeatures'
import { getEntitlements, hasFeature } from '../services/entitlementsService'

/**
 * Middleware factory that requires a specific feature
 * 
 * @param featureId - The feature ID that must be present in the user's plan
 * @returns Fastify preHandler function
 */
export function requireFeature(featureId: PlanFeatureId) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Ensure user is authenticated
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    const userId = (request.user as any).userId || (request.user as any).id

    if (!userId) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'User ID not found in token',
      })
    }

    try {
      // 2. Get user's entitlements
      const entitlements = await getEntitlements(userId)

      // 3. Check if user has the required feature
      if (!hasFeature(entitlements, featureId)) {
        return reply.code(403).send({
          error: 'Feature not available',
          message: `Feature '${featureId}' is not available in your current plan. Please upgrade your subscription.`,
          code: 'FEATURE_NOT_AVAILABLE',
          requiredFeature: featureId,
          currentPlan: entitlements.plan?.name || 'none',
        })
      }

      // 4. Feature is available - attach entitlements to request for potential use in handler
      ;(request as any).entitlements = entitlements
    } catch (error: any) {
      // If entitlements resolution fails, deny access (fail closed)
      console.error('[requireFeature] Error resolving entitlements:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Unable to verify feature access',
      })
    }
  }
}

/**
 * Middleware factory that requires ANY of the provided features
 * 
 * @param featureIds - Array of feature IDs (user needs at least one)
 * @returns Fastify preHandler function
 */
export function requireAnyFeature(featureIds: PlanFeatureId[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    const userId = (request.user as any).userId || (request.user as any).id

    if (!userId) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'User ID not found in token',
      })
    }

    try {
      const entitlements = await getEntitlements(userId)

      const hasAnyFeature = featureIds.some(id => hasFeature(entitlements, id))

      if (!hasAnyFeature) {
        return reply.code(403).send({
          error: 'Feature not available',
          message: `None of the required features are available: ${featureIds.join(', ')}. Please upgrade your subscription.`,
          code: 'FEATURE_NOT_AVAILABLE',
          requiredFeatures: featureIds,
          currentPlan: entitlements.plan?.name || 'none',
        })
      }

      ;(request as any).entitlements = entitlements
    } catch (error: any) {
      console.error('[requireAnyFeature] Error resolving entitlements:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Unable to verify feature access',
      })
    }
  }
}
