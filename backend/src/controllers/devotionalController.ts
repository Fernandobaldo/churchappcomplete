import { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodError } from 'zod'
import { createDevotionalBodySchema } from '../schemas/devotionalSchemas'
import { DevotionalService } from '../services/devotionalService'

export class DevotionalController {
  private service = new DevotionalService()

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    if (!user?.branchId) {
      return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' })
    }
    const memberId = user.memberId || null
    const result = await this.service.getAll(memberId, user.branchId)
    return reply.send(result)
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const paramsSchema = z.object({ id: z.string().cuid() })
    const { id } = paramsSchema.parse(request.params)
    const user = request.user
    const memberId = user?.memberId || null

    const devotional = await this.service.getById(id, memberId)

    if (!devotional) {
      return reply.status(404).send({ message: 'Devocional não encontrado.' })
    }

    return reply.send(devotional)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createDevotionalBodySchema.parse(request.body)
      const user = request.user

      if (!user.branchId) {
        return reply.code(400).send({ message: 'Usuário não vinculado a uma filial.' })
      }

      if (!user.memberId) {
        return reply.code(400).send({ message: 'Usuário não possui um membro associado.' })
      }

      const devotional = await this.service.create({
        ...data,
        authorId: user.memberId,
        branchId: user.branchId,
      })

      return reply.code(201).send(devotional)
    } catch (error: any) {
      // Erros de validação do Zod retornam 400 (Bad Request)
      if (error instanceof ZodError) {
        return reply.status(400).send({ 
          error: 'Dados inválidos', 
          message: error.errors?.[0]?.message || 'Erro de validação',
          details: error.errors 
        })
      }

      // Outros erros retornam 500
      console.error('❌ Erro ao criar devocional:', error)
      return reply.status(500).send({ error: 'Erro interno ao criar devocional', details: error.message })
    }
  }

  async like(request: FastifyRequest, reply: FastifyReply) {
    const paramsSchema = z.object({ id: z.string().cuid() })
    const { id } = paramsSchema.parse(request.params)
    const user = request.user
    
    if (!user?.memberId) {
      return reply.status(401).send({ message: 'Usuário não possui um membro associado.' })
    }

    try {
      await this.service.like(id, user.memberId)
    } catch {
      return reply.code(400).send({ message: 'Você já curtiu esse devocional.' })
    }

    // Retorna os dados atualizados do devocional
    const devotional = await this.service.getById(id, user.memberId)
    if (!devotional) {
      return reply.status(404).send({ message: 'Devocional não encontrado.' })
    }

    return reply.send({
      likes: devotional.likes,
      liked: devotional.liked,
    })
  }

  async unlike(request: FastifyRequest, reply: FastifyReply) {
    const paramsSchema = z.object({ id: z.string().cuid() })
    const { id } = paramsSchema.parse(request.params)
    const user = request.user
    
    if (!user?.memberId) {
      return reply.status(401).send({ message: 'Usuário não possui um membro associado.' })
    }

    await this.service.unlike(id, user.memberId)

    // Retorna os dados atualizados do devocional
    const devotional = await this.service.getById(id, user.memberId)
    if (!devotional) {
      return reply.status(404).send({ message: 'Devocional não encontrado.' })
    }

    return reply.send({
      likes: devotional.likes,
      liked: devotional.liked,
    })
  }
}
