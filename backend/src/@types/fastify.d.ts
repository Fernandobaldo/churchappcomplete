import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../middlewares/authenticate'

export interface AuthenticatedUser {
  id: string
  userId: string
  email: string
  permissions: string[]
  role: string | null
  branchId: string | null
  memberId: string | null
  churchId: string | null
  type?: 'user' | 'member'
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
