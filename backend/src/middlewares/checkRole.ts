export function checkRole(required: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;

    const hasRole = user?.role && required.includes(user.role)
    const hasPermission = user?.permissions && user.permissions.some((p: string) => required.includes(p))

    if (!hasRole && !hasPermission) {
      return reply.code(403).send({ message: 'Acesso negado' })
    }
  }
}
