// src/routes/auth/login.ts
import { FastifyInstance } from 'fastify'
import { loginController } from '../../controllers/auth/loginController'

export async function loginRoute(app: FastifyInstance) {
  app.post('/auth/login', loginController)
}
