import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { ChurchService } from '../services/churchService'
import { AuditLogger } from '../utils/auditHelper'

export class ChurchController {
  private service = new ChurchService()

  async create(request: FastifyRequest, reply: FastifyReply) {
    const bodySchema = z.object({
      name: z.string(),
      logoUrl: z.string().url().optional(),
      withBranch: z.boolean().optional(),
      branchName: z.string().optional(),
      pastorName: z.string().optional(),
    })

    const data = bodySchema.parse(request.body)

    // Obtém o usuário logado a partir do token JWT
    const user = request.user

    // Busca os dados do usuário no banco para ter nome, senha, etc
    const dbUser = await this.service.getUserData(user.sub)
    if (!dbUser) {
      return reply.code(401).send({ message: 'Usuário não encontrado.' })
    }

    const result = await this.service.createChurchWithMainBranch(data, dbUser)
    
    // Log de auditoria
    await AuditLogger.churchCreated(
      request,
      result.church.id,
      result.church.name
    )
    
    return reply.code(201).send(result)
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const churches = await this.service.getAllChurches()
    return reply.send(churches)
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params)
    const church = await this.service.getChurchById(id)

    if (!church) {
      return reply.code(404).send({ message: 'Igreja não encontrada.' })
    }

    return reply.send(church)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params)
    const data = z
      .object({
        name: z.string(),
        logoUrl: z.string().url().optional(),
        withBranch: z.boolean().optional(),
        branchName: z.string().optional(),
        pastorName: z.string().optional(),
      })
      .parse(request.body)

    const church = await this.service.updateChurch(id, data)
    return reply.send(church)
  }

 async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params
    const user = request.user
    const userId = request.user?.id

      if (!user || user.role !== 'SAASADMIN') {
        return reply.status(403).send({ error: 'Apenas o administrador do sistema pode deletar uma igreja.' })
      }

    const church = await this.service.getChurchById(id)

    if (!church) {
      return reply.status(404).send({ error: 'Igreja não encontrada.' })
    }

    //  validar se o usuário é o administrador da igreja
    if (church.ownerId !== userId) return reply.status(403).send({ error: 'Acesso negado.' })

    await this.service.deleteChurch(id)

    return reply.status(200).send({ message: 'Igreja deletada com sucesso.' })
  }

async deactivate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params
  const user = request.user

  const church = await this.service.getChurchById(id)

  if (!church) {
    return reply.status(404).send({ error: 'Igreja não encontrada.' })
  }

  // Permitir se for SAASADMIN ou ADMINGERAL dessa igreja
  const isSaasAdmin = user.role === 'SAASADMIN'
  const isChurchOwner = user.role === 'ADMINGERAL' && church.branches.some(branch =>
    branch.members.some(member => member.userId === user.id)
  )

  if (!isSaasAdmin && !isChurchOwner) {
    return reply.status(403).send({ error: 'Apenas o administrador da igreja ou do sistema pode desativar.' })
  }

  await this.service.deactivateChurch(id)

  return reply.status(200).send({ message: 'Igreja desativada com sucesso.' })
}



}
