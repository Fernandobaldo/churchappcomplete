import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'

export async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', authenticate)
}
