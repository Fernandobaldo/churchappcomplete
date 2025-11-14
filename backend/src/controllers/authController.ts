import { FastifyRequest, FastifyReply } from 'fastify'
import { loginBodySchema } from '../schemas/authSchemas'
import { validateCredentials } from '../services/authService'
import { logAudit } from '../utils/auditHelper'
import { AuditAction } from '@prisma/client'

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = loginBodySchema.parse(request.body)

  const result = await validateCredentials(email, password)

  if (!result) {
    // Log de tentativa de login falhada (sem userId ainda)
    await logAudit(
      request,
      AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
      'Auth',
      `Tentativa de login falhada: ${email}`,
      { 
        metadata: { email, reason: 'Credenciais inválidas' },
        userId: 'system',
        userEmail: email,
      }
    )
    return reply.status(401).send({ message: 'Credenciais inválidas' })
  }

  const { type, data: user } = result

  // Log de login bem-sucedido
  await logAudit(
    request,
    AuditAction.LOGIN,
    'Auth',
    `Login realizado: ${email}`,
    {
      entityId: user.id,
      metadata: { email, type },
      userId: user.id,
      userEmail: user.email,
    }
  )

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
