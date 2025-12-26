// IMPORTANTE: Carregar .env.test ANTES de qualquer importação
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.VITEST = 'true'

import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AdminRole } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import request from 'supertest'

const JWT_SECRET = process.env.JWT_SECRET || 'churchapp-secret-key'

export interface AdminTestUser {
  id: string
  name: string
  email: string
  adminRole: AdminRole
  isActive: boolean
  password: string // senha em texto puro para testes
}

export interface AdminAuthResult {
  admin: AdminTestUser
  token: string
}

/**
 * Cria um AdminUser de teste no banco de dados
 */
export async function createAdminUser(data: {
  name: string
  email: string
  password: string
  adminRole?: AdminRole
  isActive?: boolean
}): Promise<AdminTestUser> {
  const passwordHash = await bcrypt.hash(data.password, 10)

  const admin = await prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      adminRole: data.adminRole || AdminRole.SUPPORT,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  })

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    adminRole: admin.adminRole,
    isActive: admin.isActive,
    password: data.password, // mantém a senha em texto puro para testes
  }
}

/**
 * Cria múltiplos AdminUsers de teste com diferentes roles
 */
export async function createAdminUsersFixtures(): Promise<{
  superadmin: AdminTestUser
  support: AdminTestUser
  finance: AdminTestUser
}> {
  const superadmin = await createAdminUser({
    name: 'Super Admin',
    email: 'superadmin@test.com',
    password: 'password123',
    adminRole: AdminRole.SUPERADMIN,
    isActive: true,
  })

  const support = await createAdminUser({
    name: 'Support Admin',
    email: 'support@test.com',
    password: 'password123',
    adminRole: AdminRole.SUPPORT,
    isActive: true,
  })

  const finance = await createAdminUser({
    name: 'Finance Admin',
    email: 'finance@test.com',
    password: 'password123',
    adminRole: AdminRole.FINANCE,
    isActive: true,
  })

  return { superadmin, support, finance }
}

/**
 * Gera um token JWT para um AdminUser (sem fazer login real)
 */
export function generateAdminToken(admin: AdminTestUser): string {
  const payload = {
    sub: admin.id,
    adminUserId: admin.id,
    adminRole: admin.adminRole,
    email: admin.email,
    name: admin.name,
    type: 'admin' as const,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Gera um token JWT expirado para testes
 */
export function generateExpiredAdminToken(admin: AdminTestUser): string {
  const payload = {
    sub: admin.id,
    adminUserId: admin.id,
    adminRole: admin.adminRole,
    email: admin.email,
    name: admin.name,
    type: 'admin' as const,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' }) // expirado
}

/**
 * Faz login de admin via API e retorna token
 */
export async function loginAdmin(
  app: FastifyInstance,
  credentials: { email: string; password: string }
): Promise<AdminAuthResult> {
  const response = await request(app.server)
    .post('/admin/auth/login')
    .send(credentials)

  if (response.status !== 200) {
    throw new Error(
      `Falha ao fazer login de admin: ${response.status} - ${JSON.stringify(response.body)}`
    )
  }

  return {
    admin: {
      id: response.body.admin.id,
      name: response.body.admin.name,
      email: response.body.admin.email,
      adminRole: response.body.admin.adminRole,
      isActive: response.body.admin.isActive,
      password: credentials.password,
    },
    token: response.body.token,
  }
}

/**
 * Limpa todos os AdminUsers de teste do banco
 */
export async function cleanupAdminUsers(): Promise<void> {
  await prisma.adminUser.deleteMany({
    where: {
      email: {
        in: [
          'superadmin@test.com',
          'support@test.com',
          'finance@test.com',
          'inactive@test.com',
        ],
      },
    },
  })
}






