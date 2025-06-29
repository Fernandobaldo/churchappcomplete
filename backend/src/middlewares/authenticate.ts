import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify() // o Fastify já valida e coloca `request.user`
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido' })
  }
}
