import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

// 🔍 Listar todas as permissões
export async function getAllPermissionsController(request: FastifyRequest, reply: FastifyReply) {
  const permissions = await prisma.permission.findMany({
    select: { type: true },
    distinct: ['type'],
  })

  return reply.send(permissions)
}

// ✅ Atribuir permissões a um membro
export async function assignPermissionsController(request: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({ id: z.string().cuid() })
  const bodySchema = z.object({
    permissions: z.array(z.string()).min(1),
  })

  const { id } = paramsSchema.parse(request.params)
  const { permissions } = bodySchema.parse(request.body)

  const result = await prisma.permission.createMany({
    data: permissions.map((type) => ({
      memberId: id,
      type,
    })),
    skipDuplicates: true,
  })

  return reply.send({
    success: true,
    added: result.count,
  })
}
