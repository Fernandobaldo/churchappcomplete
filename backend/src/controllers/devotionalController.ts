import { FastifyRequest, FastifyReply } from 'fastify'
import { z, ZodError } from 'zod'
import { createDevotionalBodySchema, updateDevotionalBodySchema } from '../schemas/devotionalSchemas'
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

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const paramsSchema = z.object({ id: z.string().cuid() })
      const { id } = paramsSchema.parse(request.params)
      const data = updateDevotionalBodySchema.parse(request.body)
      const user = request.user

      if (!user?.memberId) {
        return reply.status(401).send({ message: 'Usuário não possui um membro associado.' })
      }

      // Verificar se o devocional existe e se o usuário é o autor
      const existing = await this.service.getById(id, user.memberId)
      if (!existing) {
        return reply.status(404).send({ message: 'Devocional não encontrado.' })
      }

      // Verificar se o usuário é o autor ou tem permissão de gerenciar devocionais
      // O existing vem do service que retorna author como objeto, mas também tem authorId
      const authorId = (existing as any).authorId || (existing as any).author?.id
      const hasPermission = user.role === 'ADMINGERAL' || 
                           user.role === 'ADMINFILIAL' ||
                           user.permissions?.includes('devotional_manage')
      
      if (authorId !== user.memberId && !hasPermission) {
        return reply.status(403).send({ message: 'Você não tem permissão para editar este devocional.' })
      }

      const updated = await this.service.update(id, data)
      return reply.send(updated)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ 
          error: 'Dados inválidos', 
          message: error.errors?.[0]?.message || 'Erro de validação',
          details: error.errors 
        })
      }

      console.error('❌ Erro ao atualizar devocional:', error)
      return reply.status(500).send({ error: 'Erro interno ao atualizar devocional', details: error.message })
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const paramsSchema = z.object({ id: z.string().cuid() })
      const { id } = paramsSchema.parse(request.params)
      const user = request.user

      if (!user?.memberId) {
        return reply.status(401).send({ message: 'Usuário não possui um membro associado.' })
      }

      // Verificar se o devocional existe e se o usuário é o autor
      const existing = await this.service.getById(id, user.memberId)
      if (!existing) {
        return reply.status(404).send({ message: 'Devocional não encontrado.' })
      }

      // Verificar se o usuário é o autor ou tem permissão de gerenciar devocionais
      if (existing.authorId !== user.memberId && 
          user.role !== 'ADMINGERAL' && 
          user.role !== 'ADMINFILIAL' &&
          !user.permissions?.includes('devotional_manage')) {
        return reply.status(403).send({ message: 'Você não tem permissão para deletar este devocional.' })
      }

      await this.service.delete(id)
      return reply.send({ message: 'Devocional deletado com sucesso' })
    } catch (error: any) {
      console.error('❌ Erro ao deletar devocional:', error)
      return reply.status(500).send({ error: 'Erro interno ao deletar devocional', details: error.message })
    }
  }
}
