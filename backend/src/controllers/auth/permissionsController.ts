import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AuditLogger } from '../../utils/auditHelper'
import { Role } from '@prisma/client'
import { RESTRICTED_PERMISSIONS } from '../../constants/permissions'
import { getMemberFromUserId } from '../../utils/authorization'

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

  // Validação: Verificar se membro com role MEMBER está tentando receber permissões restritas
  const member = await prisma.member.findUnique({
    where: { id },
    select: { 
      id: true, 
      role: true,
      branchId: true,
      Branch: {
        select: {
          churchId: true,
        },
      },
    },
  })

  if (!member) {
    return reply.code(404).send({
      message: 'Membro não encontrado',
    })
  }

  // Validação de tenant: verificar se o membro alvo pertence ao mesmo tenant do usuário
  const user = request.user
  if (!user || !user.memberId) {
    return reply.code(401).send({
      message: 'Autenticação necessária',
    })
  }

  const currentMember = await getMemberFromUserId(user.userId || user.id || '')
  if (!currentMember || !currentMember.Branch || !currentMember.Branch.Church) {
    return reply.code(403).send({
      message: 'Você não tem acesso a este membro',
    })
  }

  // ADMINGERAL pode atribuir permissões a qualquer membro da igreja
  if (currentMember.role === 'ADMINGERAL') {
    if (member.Branch?.churchId !== currentMember.Branch.Church.id) {
      return reply.code(403).send({
        message: 'Você não tem acesso a este membro',
      })
    }
  } else {
    // Outros roles só podem atribuir permissões a membros da mesma filial
    if (member.branchId !== currentMember.branchId) {
      return reply.code(403).send({
        message: 'Você só pode atribuir permissões a membros da sua filial',
      })
    }
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
    // Primeiro, remove todas as permissões existentes do membro
    await tx.permission.deleteMany({
      where: { memberId: id },
    })

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
    }

    // Busca as permissões atualizadas para garantir que foram salvas corretamente
    const updatedPermissions = await tx.permission.findMany({
      where: { memberId: id },
      select: { id: true, type: true },
    })

    return { added, permissions: updatedPermissions }
  })

  // Log de auditoria
  await AuditLogger.memberPermissionsChanged(request, id, permissions)

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
