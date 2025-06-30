import fastify from 'fastify'
import { authenticate } from './plugins/authenticate'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email: string
      permissions: string[]
    }
  }
}

const app = fastify()

app.decorateRequest('user', null)
app.decorate('authenticate', authenticate)
