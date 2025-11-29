import { FastifyRequest, FastifyReply } from 'fastify';

export function checkPermission(requiredPermissions: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as any;

        // ADMINGERAL e ADMINFILIAL têm automaticamente todas as permissões
        if (user?.role === 'ADMINGERAL' || user?.role === 'ADMINFILIAL') {
            return; // Permite acesso
        }

        if (!user.permissions || !Array.isArray(user.permissions)) {
            return reply.code(403).send({ message: 'Permissões não carregadas.' });
        }

        const hasPermission = requiredPermissions.every(permission =>
            user.permissions.includes(permission)
        );

        if (!hasPermission) {
            return reply.code(403).send({ message: 'Acesso negado: Permissão insuficiente.' });
        }
    };
}
