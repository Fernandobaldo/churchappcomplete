/**
 * Security Test Helpers - Authentication
 * 
 * Provides helpers for authentication in security tests:
 * - Login and token generation
 * - Token manipulation for testing incomplete members
 */

import { FastifyInstance } from 'fastify'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../src/lib/prisma'
import { Role } from '@prisma/client'

export interface TokenPayload {
  sub: string
  userId?: string
  email: string
  name?: string
  type?: 'user' | 'member'
  memberId?: string | null
  branchId?: string | null
  churchId?: string | null
  role?: string | null
  permissions?: string[]
  onboardingCompleted?: boolean
}

/**
 * Login user and return token
 */
export async function loginUser(
  app: FastifyInstance,
  credentials: { email: string; password: string }
): Promise<{ token: string; user: any }> {
  const response = await request(app.server)
    .post('/auth/login')
    .send(credentials)

  if (response.status !== 200) {
    throw new Error(
      `Login failed: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return {
    token: response.body.token,
    user: response.body.user,
  }
}

/**
 * Generate JWT token for testing
 * Useful for creating tokens with specific claims (e.g., incomplete member)
 */
export function generateTestToken(payload: TokenPayload): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Create token for incomplete member (user without branchId/churchId)
 * This simulates a user who hasn't completed onboarding
 */
export async function createIncompleteMemberToken(
  userId: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    throw new Error(`User ${userId} not found`)
  }

  const name = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || 'User'

  return generateTestToken({
    sub: user.id,
    userId: user.id,
    email: user.email,
    name,
    type: 'user',
    memberId: null,
    branchId: null,
    churchId: null,
    role: null,
    permissions: [],
    onboardingCompleted: false,
  })
}

/**
 * Get token for a member with specific role and permissions
 */
export async function getMemberToken(
  memberId: string,
  options: {
    includePermissions?: boolean
  } = {}
): Promise<string> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      User: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      Branch: {
        include: {
          Church: {
            select: {
              id: true,
            },
          },
        },
      },
      Permission: options.includePermissions ? {
        select: {
          type: true,
        },
      } : false,
    },
  })

  if (!member) {
    throw new Error(`Member ${memberId} not found`)
  }

  const user = member.User
  const name = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || member.name

  const permissions = options.includePermissions && member.Permission
    ? member.Permission.map(p => p.type)
    : []

  return generateTestToken({
    sub: user.id,
    userId: user.id,
    email: user.email,
    name,
    type: 'member',
    memberId: member.id,
    branchId: member.branchId,
    churchId: member.Branch?.Church?.id || null,
    role: member.role,
    permissions,
    onboardingCompleted: true,
  })
}
