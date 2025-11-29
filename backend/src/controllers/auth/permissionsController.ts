import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AuditLogger } from '../../utils/auditHelper'

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
    permissions: z.array(z.string()), // Permite array vazio para remover todas as permissões
  })

  const { id } = paramsSchema.parse(request.params)
  const { permissions } = bodySchema.parse(request.body)

  // Primeiro, remove todas as permissões existentes do membro
  await prisma.permission.deleteMany({
    where: { memberId: id },
  })

  // Depois, adiciona as novas permissões (se houver)
  let added = 0
  if (permissions.length > 0) {
    const result = await prisma.permission.createMany({
      data: permissions.map((type) => ({
        memberId: id,
        type,
      })),
      skipDuplicates: true,
    })
    added = result.count
  }

  // Log de auditoria
  await AuditLogger.memberPermissionsChanged(request, id, permissions)

  return reply.send({
    success: true,
    added,
    removed: true, // Indica que todas as permissões anteriores foram removidas
  })
}
