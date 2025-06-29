import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { createDevotionalSchema } from '../schemas/devotionalSchemas'
import { DevotionalService } from '../services/devotionalService'

export class DevotionalController {
private service = new DevotionalService()

async getAll(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user
    const result = await this.service.getAll(user.sub, user.branchId)
    return reply.send(result)
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createDevotionalSchema.body.parse(request.body)
    const user = request.user

    if (!user.branchId) {
      return reply.code(400).send({ message: 'Usuário não vinculado a uma filial.' })
    }

    const devotional = await this.service.create({
      ...data,
      authorId: user.sub,
      branchId: user.branchId,
    })

    return reply.code(201).send(devotional)
  }

  async like(request: FastifyRequest, reply: FastifyReply) {
    const paramsSchema = z.object({ id: z.string().cuid() })
    const { id } = paramsSchema.parse(request.params)
    const userId = request.user.sub

    try {
      await this.service.like(id, userId)
    } catch {
      return reply.code(400).send({ message: 'Você já curtiu esse devocional.' })
    }

    return reply.send({ success: true })
  }

  async unlike(request: FastifyRequest, reply: FastifyReply) {
    const paramsSchema = z.object({ id: z.string().cuid() })
    const { id } = paramsSchema.parse(request.params)
    const userId = request.user.sub

    await this.service.unlike(id, userId)
    return reply.send({ success: true })
  }
}
