import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../middlewares/authenticate'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      permissions: string[]
    }
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
