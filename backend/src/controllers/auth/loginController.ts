import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../../services/authService'

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })

  try {
    const { email, password } = bodySchema.parse(request.body)
    const authService = new AuthService()

    const result = await authService.login(email, password)

    return reply.status(200).send(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ message: 'Campos inválidos', issues: error.errors })
    }

    if (error.message === 'Credenciais inválidas') {
      return reply.status(401).send({ message: 'Email ou senha incorretos' })
    }

    return reply.status(500).send({ message: 'Erro interno ao tentar logar' })
  }
}
