import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { registerUserService } from '../../services/auth/registerService'

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    branchId: z.string().optional(),
    role: z.enum(['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL']).optional(),
    permissions: z.array(z.string()).optional(),
    birthDate: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    fromLandingPage: z.boolean().optional(), // ← indica se é externo
  })

  const data = bodySchema.parse(request.body)

  try {
    const result = await registerUserService(data)
    return reply.status(201).send(result)
  } catch (error) {
    console.error('❌ Erro ao registrar usuário:', error)
    return reply.status(500).send({ error: 'Erro ao registrar usuário', details: error.message })
  }
}
