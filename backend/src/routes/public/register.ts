// src/routes/public/register.ts
import { FastifyInstance } from 'fastify'
import { publicRegisterController } from '../../controllers/public/publicRegisterController'

export async function publicRegisterRoute(app: FastifyInstance) {
  app.post('/register', publicRegisterController)
}
