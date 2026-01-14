/**
 * ENTITLEMENTS CONTROLLER
 * 
 * Provides endpoints to query user's entitlements (features and limits).
 * This is useful for the frontend to:
 * - Check which features are available
 * - Show upgrade prompts
 * - Disable UI elements for unavailable features
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { getEntitlements } from '../services/entitlementsService'

/**
 * GET /subscriptions/entitlements
 * 
 * Returns the current user's entitlements based on their active subscription.
 */
export async function getEntitlementsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const userId = (request.user as any).userId || (request.user as any).id

    if (!userId) {
      return reply.status(401).send({ error: 'User ID not found in token' })
    }

    const entitlements = await getEntitlements(userId)

    return reply.send(entitlements)
  } catch (error: any) {
    console.error('[getEntitlementsHandler] Error:', error)
    return reply.status(500).send({
      error: 'Internal server error',
      message: error.message,
    })
  }
}
