import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  getAuditLogs,
  getMemberAuditLogs,
  getBranchAuditLogs,
  getChurchAuditLogs,
  getUserAuditLogs,
} from '../services/auditService'
import { getMemberFromUserId } from '../utils/authorization'
import { AuditAction } from '@prisma/client'

export async function getAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Buscar dados do membro para obter churchId
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro não encontrado' })
    }

    // Apenas ADMINGERAL pode ver todos os logs da igreja
    if (currentMember.role !== 'ADMINGERAL') {
      return reply.status(403).send({ error: 'Apenas Administradores Gerais podem visualizar logs de auditoria' })
    }

    const querySchema = z.object({
      userId: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      action: z.nativeEnum(AuditAction).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.coerce.number().int().positive().max(1000).optional().default(100),
      offset: z.coerce.number().int().nonnegative().optional().default(0),
    })

    const query = querySchema.parse(request.query)

    const filters: any = {
      limit: query.limit,
      offset: query.offset,
    }

    if (query.userId) filters.userId = query.userId
    if (query.entityType) filters.entityType = query.entityType
    if (query.entityId) filters.entityId = query.entityId
    if (query.action) filters.action = query.action
    if (query.startDate) filters.startDate = new Date(query.startDate)
    if (query.endDate) filters.endDate = new Date(query.endDate)

    const result = await getAuditLogs(filters)

    return reply.send(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Parâmetros inválidos', details: error.errors })
    }
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMemberAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const { id } = z.object({ id: z.string() }).parse(request.params)

    // Buscar dados do membro atual
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro atual não encontrado' })
    }

    // Verificar se pode ver logs deste membro
    // ADMINGERAL pode ver logs de qualquer membro da igreja
    // Outros só podem ver seus próprios logs
    if (currentMember.role !== 'ADMINGERAL' && currentMember.id !== id) {
      return reply.status(403).send({ error: 'Você só pode visualizar seus próprios logs' })
    }

    const querySchema = z.object({
      limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    })

    const query = querySchema.parse(request.query)

    const result = await getMemberAuditLogs(id, query.limit)

    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getBranchAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const { id } = z.object({ id: z.string() }).parse(request.params)

    // Apenas ADMINGERAL pode ver logs de branches
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember || currentMember.role !== 'ADMINGERAL') {
      return reply.status(403).send({ error: 'Apenas Administradores Gerais podem visualizar logs de filiais' })
    }

    const querySchema = z.object({
      limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    })

    const query = querySchema.parse(request.query)

    const result = await getBranchAuditLogs(id, query.limit)

    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMyAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user

    if (!user || !user.userId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const querySchema = z.object({
      limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    })

    const query = querySchema.parse(request.query)

    const result = await getUserAuditLogs(user.userId, query.limit)

    return reply.send(result)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

