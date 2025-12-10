export function checkRole(required) {
    return async (request, reply) => {
        const user = request.user;
        // Verifica se o usuário tem uma das roles necessárias
        // checkRole verifica apenas roles do token, não permissões do banco
        const hasRole = user?.role && required.includes(user.role);
        if (!hasRole) {
            return reply.code(403).send({
                message: `Acesso negado: Role insuficiente. Necessário: ${required.join(' ou ')}, Atual: ${user?.role || 'não definida'}`
            });
        }
    };
}
