import { FastifyReply, FastifyRequest } from 'fastify'
import { memberIdParamSchema, updateMemberBodySchema } from '../schemas/memberSchemas'
import { findAllMembers, findMemberById, formatDate, updateMember } from '../services/memberService'
import { parse } from 'date-fns'

export async function getAllMembers(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user
  const members = await findAllMembers(user.branchId)
  return reply.send(members)
}

export async function getMemberById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = memberIdParamSchema.parse(request.params)
  const member = await findMemberById(id)
  if (!member) {
    return reply.code(404).send({ message: 'Membro não encontrado' })
  }

  return reply.send({
    ...member,
    birthDate: formatDate(member.birthDate),
  })
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
  const { id } = memberIdParamSchema.parse(request.params)
  const body = updateMemberBodySchema.parse(request.body)

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
  return reply.send(updated)
}
