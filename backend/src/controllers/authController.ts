import { FastifyRequest, FastifyReply } from 'fastify'
import { loginBodySchema } from '../schemas/authSchemas'
import { validateCredentials } from '../services/authService'

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = loginBodySchema.parse(request.body)

  const user = await validateCredentials(email, password)

  if (!user) {
    return reply.status(401).send({ message: 'Credenciais inválidas' })
  }

  const token = request.server.jwt.sign(
    {
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      permissions: user.permissions.map(p => p.type),
    },
    {
      sub: user.id,
      expiresIn: '7d',
    }
)

return reply.send({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      permissions: user.permissions.map(p => ({ type: p.type })),
    },
  })
}
