import { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Middleware que verifica se o usuário tem branchId associado.
 * Retorna 400 (Bad Request) se não tiver, permitindo que o controller
 * trate o erro antes dos middlewares de permissão retornarem 403.
 */
export function checkBranchId() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any

    if (!user?.branchId) {
      return reply.code(400).send({ 
        message: 'Usuário não vinculado a uma filial.' 
      })
    }
  }
}

