import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export function checkPermission(requiredPermissions: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as any;

        // ADMINGERAL e ADMINFILIAL têm automaticamente todas as permissões
        if (user?.role === 'ADMINGERAL' || user?.role === 'ADMINFILIAL') {
            return; // Permite acesso
        }

        // Busca as permissões atualizadas do banco de dados em vez de confiar apenas no token
        // Isso garante que permissões atualizadas sejam verificadas corretamente
        let memberPermissions: string[] = [];
        
        if (user?.memberId) {
            try {
                const member = await prisma.member.findUnique({
                    where: { id: user.memberId },
                    select: {
                        Permission: {
                            select: { type: true }
                        }
                    }
                });
                
                if (member) {
                    memberPermissions = member.Permission.map(p => p.type);
                    console.log(`[PERMISSIONS DEBUG] Permissões buscadas do banco para membro ${user.memberId}:`, memberPermissions);
                } else {
                    console.warn(`[PERMISSIONS DEBUG] Member não encontrado no banco para memberId: ${user.memberId}`);
                    // Se member não foi encontrado, usa permissões do token como fallback
                    memberPermissions = user.permissions || [];
                }
            } catch (error) {
                console.error(`[PERMISSIONS DEBUG] Erro ao buscar permissões do banco:`, error);
                // Em caso de erro, usa as permissões do token como fallback
                memberPermissions = user.permissions || [];
            }
        } else {
            // Se não tem memberId, usa as permissões do token
            console.warn(`[PERMISSIONS DEBUG] Usuário sem memberId. Email: ${user?.email || 'desconhecido'}, Role: ${user?.role || 'não definida'}`);
            memberPermissions = user.permissions || [];
        }

        if (!memberPermissions || !Array.isArray(memberPermissions)) {
            return reply.code(403).send({ message: 'Permissões não carregadas.' });
        }

        const hasPermission = requiredPermissions.every(permission =>
            memberPermissions.includes(permission)
        );

        if (!hasPermission) {
            console.log(`[PERMISSIONS DEBUG] Acesso negado para ${user?.email || 'usuário'}. Permissões necessárias: ${requiredPermissions.join(', ')}, Permissões do usuário: ${memberPermissions.join(', ') || 'nenhuma'}, memberId: ${user?.memberId || 'não definido'}, role: ${user?.role || 'não definida'}`);
            return reply.code(403).send({ 
                message: `Acesso negado: Permissão insuficiente. Necessário: ${requiredPermissions.join(', ')}, Permissões do usuário: ${memberPermissions.join(', ') || 'nenhuma'}` 
            });
        }
    };
}
