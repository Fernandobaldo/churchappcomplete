import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { publicRegisterUserService } from '../../services/public/publicRegisterService'

export async function publicRegisterController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    firstName: z.string().min(1, 'Primeiro nome obrigatório'),
    lastName: z.string().min(1, 'Sobrenome obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    phone: z.string().min(1, 'Telefone é obrigatório'), // Obrigatório, mas sem validação de formato
    document: z.string().min(11, 'CPF/CNPJ é obrigatório (mínimo 11 dígitos)').regex(/^[\d\.\-\/]+$/, 'CPF/CNPJ inválido'),
  })

  const data = bodySchema.parse(request.body)

  const result = await publicRegisterUserService(data)

  return reply.status(201).send({
    user: {
      id: result.user.id,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      email: result.user.email,
    },
    token: result.token,
  })
}
