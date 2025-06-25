import { FastifyRequest, FastifyReply } from 'fastify';

export function checkRole(requiredRoles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as any;

        if (!user || !requiredRoles.includes(user.role)) {
            return reply.code(403).send({
                message: 'Acesso negado: Cargo insuficiente.',
            });
        }
    };
}
