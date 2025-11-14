import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

// Carrega .env.test se estiver em ambiente de teste
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  dotenv.config({ path: '.env.test' })
} else {
  dotenv.config()
}

// Em testes, usa o mesmo secret que os testes estão usando
// Em produção, usa o JWT_SECRET do .env
const JWT_SECRET = (process.env.NODE_ENV === 'test' || process.env.VITEST) 
  ? (process.env.JWT_SECRET || 'churchapp-secret-key')
  : (process.env.JWT_SECRET || 'secret_dev_key')

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ message: 'Token ausente' })
    return
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
      userId?: string
      email: string
      type?: 'user' | 'member'
      permissions?: string[]
      role?: string
      branchId?: string
      memberId?: string
    }

    request.user = {
      id: payload.sub,
      userId: payload.userId || payload.sub,
      email: payload.email,
      type: payload.type || 'user',
      permissions: payload.permissions || [],
      role: payload.role || null,
      branchId: payload.branchId || null,
      memberId: payload.memberId || null,
    }
  } catch (error: any) {
    // Debug em ambiente de teste
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH MIDDLEWARE] Erro ao verificar token:`, error.message)
      console.log(`[AUTH MIDDLEWARE] JWT_SECRET usado:`, JWT_SECRET?.substring(0, 10) + '...')
    }
    reply.status(401).send({ message: 'Token inválido' })
    return
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      userId: string
      email: string
      type: 'user' | 'member'
      permissions: string[]
      role: string | null
      branchId: string | null
      memberId: string | null
    }
  }
}