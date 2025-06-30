import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../../services/authService'

export async function loginRoute(app: FastifyInstance) {
  const authService = new AuthService()

  app.post('/login', async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const { email, password } = bodySchema.parse(request.body)

    try {
      const { token, user } = await authService.login(email, password)
      return reply.send({ token, user })
    } catch (error) {
      return reply.status(401).send({ message: 'Credenciais inválidas' })
    }
  })
}
