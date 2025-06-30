import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Token ausente' })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
      email: string
      permissions: string[]
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      permissions: payload.permissions,
    }
  } catch (error) {
    return reply.status(401).send({ message: 'Token inválido' })
  }
}
