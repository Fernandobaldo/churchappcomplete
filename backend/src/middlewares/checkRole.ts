import { FastifyRequest, FastifyReply } from 'fastify'

export function checkRole(required: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;

    // Verifica se o usuário tem uma das roles necessárias
    // checkRole verifica apenas roles do token, não permissões do banco
    const hasRole = user?.role && required.includes(user.role)

    if (!hasRole) {
      return reply.code(403).send({ 
        message: `Acesso negado: Role insuficiente. Necessário: ${required.join(' ou ')}, Atual: ${user?.role || 'não definida'}` 
      })
    }
  }
}
