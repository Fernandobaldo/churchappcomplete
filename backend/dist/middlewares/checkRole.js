export function checkRole(required) {
    return async (request, reply) => {
        const user = request.user;
        const hasRole = user?.role && required.includes(user.role);
        const hasPermission = user?.permissions && user.permissions.some((p) => required.includes(p));
        if (!hasRole && !hasPermission) {
            return reply.code(403).send({ message: 'Acesso negado' });
        }
    };
}
