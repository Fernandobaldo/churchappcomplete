import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { loginUserService } from '../../services/auth/loginService'

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    email: z.string().email(),
    password: z.string()
  })

  const { email, password } = bodySchema.parse(request.body)

  try {
    const result = await loginUserService(request.server, email, password)
    return reply.send(result)
  } catch (error) {
    return reply.status(401).send({ message: 'Credenciais inválidas' })
  }
}
