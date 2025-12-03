import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AuditLogger } from '../../utils/auditHelper'
import { Role } from '@prisma/client'
import { RESTRICTED_PERMISSIONS } from '../../constants/permissions'

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
  try {
    const paramsSchema = z.object({ id: z.string().cuid() })
    const bodySchema = z.object({
      permissions: z.array(z.string()), // Permite array vazio para remover todas as permissões
    })

    let id: string
    let permissions: string[]

    try {
      id = paramsSchema.parse(request.params).id
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          message: 'ID inválido',
          errors: error.errors 
        })
      }
      throw error
    }

    try {
      permissions = bodySchema.parse(request.body).permissions
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          message: 'Dados inválidos',
          errors: error.errors 
        })
      }
      throw error
    }

  console.log(`[PERMISSIONS DEBUG] POST /permissions/${id}`)
  console.log(`[PERMISSIONS DEBUG] Permissões recebidas:`, permissions)
  console.log(`[PERMISSIONS DEBUG] Quantidade de permissões:`, permissions.length)

  // Validação: Verificar se membro com role MEMBER está tentando receber permissões restritas
  const member = await prisma.member.findUnique({
    where: { id },
    select: { id: true, role: true },
  })

  if (!member) {
    return reply.code(404).send({
      message: 'Membro não encontrado',
    })
  }

  // Permissões que requerem pelo menos role COORDINATOR
  const requestedRestricted = permissions.filter(perm => RESTRICTED_PERMISSIONS.includes(perm))

  if (member.role === Role.MEMBER && requestedRestricted.length > 0) {
    return reply.code(403).send({
      message: 'Esta permissão requer pelo menos a role de Coordenador',
      error: `Membros com role MEMBER não podem receber as permissões: ${requestedRestricted.join(', ')}`,
    })
  }

  // Usa transação para garantir atomicidade
  const result = await prisma.$transaction(async (tx) => {
    // Primeiro, busca permissões existentes antes de remover
    const existingPermissions = await tx.permission.findMany({
      where: { memberId: id },
      select: { id: true, type: true },
    })
    console.log(`[PERMISSIONS DEBUG] Permissões existentes antes de remover:`, existingPermissions)

    // Primeiro, remove todas as permissões existentes do membro
    const deleteResult = await tx.permission.deleteMany({
      where: { memberId: id },
    })
    console.log(`[PERMISSIONS DEBUG] Permissões removidas:`, deleteResult.count)

    // Depois, adiciona as novas permissões (se houver)
    let added = 0
    if (permissions.length > 0) {
      const createResult = await tx.permission.createMany({
        data: permissions.map((type) => ({
          memberId: id,
          type,
        })),
        skipDuplicates: true,
      })
      added = createResult.count
      console.log(`[PERMISSIONS DEBUG] Permissões criadas:`, added)
    }

    // Busca as permissões atualizadas para garantir que foram salvas corretamente
    const updatedPermissions = await tx.permission.findMany({
      where: { memberId: id },
      select: { id: true, type: true },
    })

    console.log(`[PERMISSIONS DEBUG] Permissões encontradas após salvar (dentro da transação):`, updatedPermissions)
    console.log(`[PERMISSIONS DEBUG] Quantidade de permissões encontradas:`, updatedPermissions.length)

    return { added, permissions: updatedPermissions }
  })

  // Log de auditoria
  await AuditLogger.memberPermissionsChanged(request, id, permissions)

  console.log(`[PERMISSIONS DEBUG] Resposta final do POST:`, {
    success: true,
    added: result.added,
    permissionsCount: result.permissions.length,
    permissions: result.permissions
  })

    return reply.send({
      success: true,
      added: result.added,
      permissions: result.permissions, // Retorna as permissões atualizadas
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ 
        message: 'Dados inválidos',
        errors: error.errors 
      })
    }
    throw error
  }
}
