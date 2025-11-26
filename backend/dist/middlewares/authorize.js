export function authorize(allowedRoles) {
    return async function (request, reply) {
        const user = request.user;
        if (!user || !allowedRoles.includes(user.role)) {
            return reply.status(403).send({ error: 'Acesso não autorizado' });
        }
    };
}
