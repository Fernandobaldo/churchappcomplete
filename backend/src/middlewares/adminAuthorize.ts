import { FastifyRequest, FastifyReply } from 'fastify'
import { AdminRole } from '@prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: {
      id: string
      adminUserId: string
      email: string
      adminRole: AdminRole
      name: string
      type: 'admin'
    }
  }
}

/**
 * Middleware para verificar se o usuário é um AdminUser válido
 */
export async function requireAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verifica se o usuário foi autenticado como admin
  // Isso será preenchido por um middleware de autenticação específico de admin
  if (!request.adminUser) {
    return reply.status(401).send({ error: 'Autenticação de admin necessária' })
  }
}

/**
 * Middleware para verificar permissões baseadas em AdminRole
 * @param allowedRoles Array de roles permitidos
 */
export function requireAdminRole(allowedRoles: AdminRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    // Primeiro verifica se é admin autenticado
    if (!request.adminUser) {
      return reply.status(401).send({ error: 'Autenticação de admin necessária' })
    }

    // Verifica se o role do admin está na lista de roles permitidos
    if (!allowedRoles.includes(request.adminUser.adminRole)) {
      return reply
        .status(403)
        .send({ error: 'Acesso não autorizado. Permissão insuficiente.' })
    }
  }
}

/**
 * Middleware combinado: autentica admin e verifica role
 * @param allowedRoles Array de roles permitidos
 */
export function authenticateAndAuthorizeAdmin(allowedRoles: AdminRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    // A autenticação será feita por um middleware separado que popula request.adminUser
    // Aqui apenas verificamos o role
    if (!request.adminUser) {
      return reply.status(401).send({ error: 'Autenticação de admin necessária' })
    }

    if (!allowedRoles.includes(request.adminUser.adminRole)) {
      return reply
        .status(403)
        .send({ error: 'Acesso não autorizado. Permissão insuficiente.' })
    }
  }
}

