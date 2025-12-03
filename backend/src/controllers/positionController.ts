import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PositionService } from '../services/positionService'
import { getMemberFromUserId } from '../utils/authorization'
import { AuditLogger } from '../utils/auditHelper'

const positionService = new PositionService()

const createPositionSchema = z.object({
  name: z.string().min(1, 'Nome do cargo é obrigatório'),
})

const updatePositionSchema = z.object({
  name: z.string().min(1, 'Nome do cargo é obrigatório'),
})

export class PositionController {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user
      if (!user || !user.memberId) {
        return reply.status(401).send({ error: 'Autenticação necessária' })
      }

      const member = await getMemberFromUserId(user.userId || user.id)
      if (!member || !member.Branch) {
        return reply.status(404).send({ error: 'Membro não encontrado' })
      }

      const churchId = member.Branch.churchId

      // Garantir que os cargos padrão existem
      await positionService.ensureDefaultPositions(churchId)

      const positions = await positionService.getAllPositions(churchId)
      return reply.send(positions)
    } catch (error: any) {
      return reply.status(500).send({ error: error.message })
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user
      if (!user || !user.memberId) {
        return reply.status(401).send({ error: 'Autenticação necessária' })
      }

      const member = await getMemberFromUserId(user.userId || user.id)
      if (!member || !member.Branch) {
        return reply.status(404).send({ error: 'Membro não encontrado' })
      }

      // Apenas ADMINGERAL pode criar cargos
      if (member.role !== 'ADMINGERAL') {
        return reply.status(403).send({ error: 'Apenas administradores gerais podem criar cargos' })
      }

      const data = createPositionSchema.parse(request.body)
      const churchId = member.Branch.churchId

      const position = await positionService.createPosition(churchId, data.name, false)

      await AuditLogger.memberUpdated(request, member.id, {
        action: 'POSITION_CREATED',
        positionName: position.name,
      })

      return reply.status(201).send(position)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
      }
      return reply.status(500).send({ error: error.message })
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user
      if (!user || !user.memberId) {
        return reply.status(401).send({ error: 'Autenticação necessária' })
      }

      const member = await getMemberFromUserId(user.userId || user.id)
      if (!member || !member.Branch) {
        return reply.status(404).send({ error: 'Membro não encontrado' })
      }

      // Apenas ADMINGERAL pode atualizar cargos
      if (member.role !== 'ADMINGERAL') {
        return reply.status(403).send({ error: 'Apenas administradores gerais podem atualizar cargos' })
      }

      const { id } = z.object({ id: z.string().cuid() }).parse(request.params)
      const data = updatePositionSchema.parse(request.body)

      const position = await positionService.getPositionById(id)
      if (!position) {
        return reply.status(404).send({ error: 'Cargo não encontrado' })
      }

      if (position.churchId !== member.Branch.churchId) {
        return reply.status(403).send({ error: 'Você só pode editar cargos da sua igreja' })
      }

      if (position.isDefault) {
        return reply.status(403).send({ error: 'Não é possível editar cargos padrão do sistema' })
      }

      const updated = await positionService.updatePosition(id, data.name)

      await AuditLogger.memberUpdated(request, member.id, {
        action: 'POSITION_UPDATED',
        positionId: id,
        positionName: updated.name,
      })

      return reply.send(updated)
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
      }
      return reply.status(500).send({ error: error.message })
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user
      if (!user || !user.memberId) {
        return reply.status(401).send({ error: 'Autenticação necessária' })
      }

      const member = await getMemberFromUserId(user.userId || user.id)
      if (!member || !member.Branch) {
        return reply.status(404).send({ error: 'Membro não encontrado' })
      }

      // Apenas ADMINGERAL pode deletar cargos
      if (member.role !== 'ADMINGERAL') {
        return reply.status(403).send({ error: 'Apenas administradores gerais podem deletar cargos' })
      }

      const { id } = z.object({ id: z.string().cuid() }).parse(request.params)

      const position = await positionService.getPositionById(id)
      if (!position) {
        return reply.status(404).send({ error: 'Cargo não encontrado' })
      }

      if (position.churchId !== member.Branch.churchId) {
        return reply.status(403).send({ error: 'Você só pode deletar cargos da sua igreja' })
      }

      await positionService.deletePosition(id)

      await AuditLogger.memberUpdated(request, member.id, {
        action: 'POSITION_DELETED',
        positionId: id,
        positionName: position.name,
      })

      return reply.send({ message: 'Cargo deletado com sucesso' })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Dados inválidos', details: error.errors })
      }
      return reply.status(500).send({ error: error.message })
    }
  }
}
