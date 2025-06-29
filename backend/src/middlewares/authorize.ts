import { FastifyRequest, FastifyReply } from 'fastify';

export function authorize(allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return reply.status(403).send({ error: 'Acesso não autorizado' });
    }
  };
}
