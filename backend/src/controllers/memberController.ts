import { FastifyReply, FastifyRequest } from 'fastify'
import { memberIdParamSchema, updateMemberBodySchema } from '../schemas/memberSchemas'
import { findAllMembers, findMemberById, formatDate, updateMember } from '../services/memberService'
import { parse } from 'date-fns'
import { getMemberFromUserId, validateMemberEditPermission } from '../utils/authorization'
import { AuditLogger } from '../utils/auditHelper'

export async function getAllMembers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Buscar dados completos do membro para obter churchId
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro não encontrado' })
    }

    const churchId = currentMember.branch.churchId
    const branchId = user.branchId || currentMember.branchId
    const userRole = user.role || currentMember.role

    const members = await findAllMembers(branchId, churchId, userRole)
    return reply.send(members)
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMemberById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = memberIdParamSchema.parse(request.params)
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    const member = await findMemberById(id)
    if (!member) {
      return reply.code(404).send({ message: 'Membro não encontrado' })
    }

    // Buscar dados completos do membro atual
    const currentMember = await getMemberFromUserId(user.userId)
    if (!currentMember) {
      return reply.status(404).send({ error: 'Membro atual não encontrado' })
    }

    // ADMINGERAL pode ver qualquer membro da igreja
    if (currentMember.role === 'ADMINGERAL') {
      if (member.branch.churchId !== currentMember.branch.churchId) {
        return reply.status(403).send({ error: 'Você só pode visualizar membros da sua igreja' })
      }
    }
    // ADMINFILIAL e COORDINATOR só podem ver membros da sua filial
    else if (currentMember.role === 'ADMINFILIAL' || currentMember.role === 'COORDINATOR') {
      if (member.branchId !== currentMember.branchId) {
        return reply.status(403).send({ error: 'Você só pode visualizar membros da sua filial' })
      }
    }
    // MEMBER só pode ver a si mesmo
    else {
      if (member.id !== currentMember.id) {
        return reply.status(403).send({ error: 'Você só pode visualizar seu próprio perfil' })
      }
    }

    return reply.send({
      ...member,
      birthDate: formatDate(member.birthDate),
    })
  } catch (error: any) {
    return reply.status(500).send({ error: error.message })
  }
}

export async function getMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub
  const user = await findMemberById(userId)

  if (!user) {
    return reply.code(404).send({ message: 'Usuário não encontrado' })
  }

  return reply.send({
    ...user,
    birthDate: formatDate(user.birthDate),
  })
}

export async function updateMemberById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = memberIdParamSchema.parse(request.params)
    const body = updateMemberBodySchema.parse(request.body)
    const user = request.user

    if (!user || !user.memberId) {
      return reply.status(401).send({ error: 'Autenticação necessária' })
    }

    // Validar permissão de edição
    await validateMemberEditPermission(user.memberId, id)

    const dataToUpdate: any = { ...body }

    if (body.birthDate) {
      const parsedDate = parse(body.birthDate, 'dd/MM/yyyy', new Date())
      if (isNaN(parsedDate.getTime())) {
        return reply.status(400).send({ message: 'Data de nascimento inválida.' })
      }
      dataToUpdate.birthDate = parsedDate
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return reply.status(400).send({ message: 'Nenhum dado para atualizar.' })
    }

    const updated = await updateMember(id, dataToUpdate)

    // Log de auditoria
    await AuditLogger.memberUpdated(request, id, dataToUpdate)

    return reply.send(updated)
  } catch (error: any) {
    if (error.message?.includes('permissão') || error.message?.includes('não pode')) {
      return reply.status(403).send({ error: error.message })
    }
    return reply.status(500).send({ error: error.message })
  }
}
