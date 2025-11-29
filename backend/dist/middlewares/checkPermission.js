export function checkPermission(requiredPermissions) {
    return async (request, reply) => {
        const user = request.user;
        // ADMINGERAL e ADMINFILIAL têm automaticamente todas as permissões
        if (user?.role === 'ADMINGERAL' || user?.role === 'ADMINFILIAL') {
            return; // Permite acesso
        }
        if (!user.permissions || !Array.isArray(user.permissions)) {
            return reply.code(403).send({ message: 'Permissões não carregadas.' });
        }
        const hasPermission = requiredPermissions.every(permission => user.permissions.includes(permission));
        if (!hasPermission) {
            return reply.code(403).send({ message: 'Acesso negado: Permissão insuficiente.' });
        }
    };
}
