import { FastifyRequest, FastifyReply } from 'fastify'
import { loginBodySchema } from '../schemas/authSchemas'
import { validateCredentials } from '../services/authService'

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = loginBodySchema.parse(request.body)

  const result = await validateCredentials(email, password)

  if (!result) {
    return reply.status(401).send({ message: 'Credenciais inválidas' })
  }

  const { type, data: user } = result

  const tokenPayload: any = {
    email: user.email,
    type,
    sub: user.id,
  }

  // Se for member, adiciona dados extras no token
  if (type === 'member') {
    tokenPayload.name = user.name
    tokenPayload.role = user.role
    tokenPayload.branchId = user.branchId
    tokenPayload.permissions = user.permissions.map(p => p.type)
  }

  const token = request.server.jwt.sign(tokenPayload, { expiresIn: '7d' })

  // Monta resposta com base no tipo
  const responseUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(type === 'member' && {
      role: user.role,
      branchId: user.branchId,
      permissions: user.permissions.map(p => ({ type: p.type })),
    }),
  }

  return reply.send({
    token,
    type,
    user: responseUser,
  })
}
