import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { env } from '../env'
import { AdminRole } from '@prisma/client'

// Carrega .env.test se estiver em ambiente de teste
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  dotenv.config({ path: '.env.test' })
} else {
  dotenv.config()
}

const JWT_SECRET = env.JWT_SECRET

/**
 * Middleware para autenticar AdminUser via JWT
 */
export async function adminAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ message: 'Token ausente' })
    return
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub?: string
      adminUserId?: string
      adminRole?: AdminRole
      email?: string
      name?: string
      type?: string
      impersonatedByAdminId?: string
      isImpersonated?: boolean
    }

    // Verifica se é um token de admin (não de usuário comum)
    if (payload.type !== 'admin') {
      reply.status(401).send({ message: 'Token inválido para acesso de admin' })
      return
    }

    // Verifica se é um token de impersonação (não permitido para admin)
    if (payload.isImpersonated) {
      reply.status(401).send({ message: 'Token de impersonação não permitido para admin' })
      return
    }

    if (!payload.adminUserId || !payload.adminRole || !payload.email) {
      reply.status(401).send({ message: 'Token inválido - dados incompletos' })
      return
    }

    // Popula request.adminUser para uso nos middlewares de autorização
    request.adminUser = {
      id: payload.adminUserId,
      adminUserId: payload.adminUserId,
      email: payload.email,
      adminRole: payload.adminRole,
      name: payload.name || '',
      type: 'admin',
    }
  } catch (error: any) {
    reply.status(401).send({ message: 'Token inválido ou expirado' })
    return
  }
}

