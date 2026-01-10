/**
 * Authentication utilities for tests
 * 
 * Provides helpers to create JWT tokens and attach auth headers
 * for authenticated test requests.
 */

import type { FastifyInstance } from 'fastify'

/**
 * Generate JWT token for a user
 * 
 * Creates a JWT token with user data for authenticated requests.
 * 
 * @param app - Fastify app instance (must have JWT plugin registered)
 * @param payload - Token payload with user information
 * @returns Promise<string> - JWT token
 * 
 * @example
 * ```typescript
 * const app = await createTestApp()
 * const token = await generateTestToken(app, {
 *   sub: user.id,
 *   email: user.email,
 *   name: user.name,
 *   onboardingCompleted: true,
 * })
 * ```
 */
export async function generateTestToken(
  app: FastifyInstance,
  payload: {
    sub: string
    email: string
    name: string
    type?: 'user' | 'member'
    memberId?: string | null
    branchId?: string | null
    role?: string | null
    churchId?: string | null
    permissions?: string[]
    onboardingCompleted?: boolean
  }
): Promise<string> {
  const defaultPayload = {
    type: 'user' as const,
    memberId: null,
    branchId: null,
    role: null,
    churchId: null,
    permissions: [],
    onboardingCompleted: false,
    ...payload,
  }

  return app.jwt.sign(defaultPayload, { expiresIn: '7d' })
}

/**
 * Create authorization header for authenticated requests
 * 
 * Convenience helper to attach auth token to request headers.
 * 
 * @param token - JWT token
 * @returns Object with Authorization header
 * 
 * @example
 * ```typescript
 * const token = await generateTestToken(app, {...})
 * const response = await request(app.server)
 *   .get('/protected')
 *   .set(attachAuthHeader(token))
 * ```
 */
export function attachAuthHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Create authenticated request helper
 * 
 * Combines token generation and header attachment for convenience.
 * 
 * @param app - Fastify app instance
 * @param user - User data for token
 * @returns Object with token and headers
 * 
 * @example
 * ```typescript
 * const { token, headers } = await createAuthHeaders(app, {
 *   id: user.id,
 *   email: user.email,
 *   name: user.name,
 * })
 * 
 * const response = await request(app.server)
 *   .get('/protected')
 *   .set(headers)
 * ```
 */
export async function createAuthHeaders(
  app: FastifyInstance,
  user: {
    id: string
    email: string
    name: string
    onboardingCompleted?: boolean
    memberId?: string | null
    branchId?: string | null
    churchId?: string | null
    role?: string | null
  }
) {
  const token = await generateTestToken(app, {
    sub: user.id,
    email: user.email,
    name: user.name,
    onboardingCompleted: user.onboardingCompleted ?? false,
    memberId: user.memberId ?? null,
    branchId: user.branchId ?? null,
    churchId: user.churchId ?? null,
    role: user.role ?? null,
  })

  return {
    token,
    headers: attachAuthHeader(token),
  }
}

