import { loginBodySchema } from '../schemas/authSchemas';
import { AuthService } from '../services/authService';
import { logAudit } from '../utils/auditHelper';
import { AuditAction } from '@prisma/client';
export async function loginHandler(request, reply) {
    const { email, password } = loginBodySchema.parse(request.body);
    const authService = new AuthService();
    try {
        const result = await authService.login(email, password);
        if (!result) {
            // Log de tentativa de login falhada (sem userId ainda)
            await logAudit(request, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'Auth', `Tentativa de login falhada: ${email}`, {
                metadata: { email, reason: 'Credenciais inválidas' },
                userId: 'system',
                userEmail: email,
            });
            return reply.status(401).send({ message: 'Credenciais inválidas' });
        }
        const { token, user, type } = result;
        // Log de login bem-sucedido
        await logAudit(request, AuditAction.LOGIN, 'Auth', `Login realizado: ${email}`, {
            entityId: user.id,
            metadata: { email, type, memberId: user.memberId || null },
            userId: user.id,
            userEmail: user.email,
        });
        return reply.send({
            token,
            type,
            user,
        });
    }
    catch (error) {
        // Verifica se é erro de usuário não encontrado
        if (error.message && error.message.includes('Usuário não encontrado')) {
            await logAudit(request, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'Auth', `Tentativa de login falhada: ${email} - Usuário não encontrado`, {
                metadata: { email, reason: 'Usuário não encontrado' },
                userId: 'system',
                userEmail: email,
            });
            return reply.status(404).send({ message: error.message });
        }
        // Verifica se é erro de senha incorreta
        if (error.message && error.message.includes('Senha incorreta')) {
            await logAudit(request, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'Auth', `Tentativa de login falhada: ${email} - Senha incorreta`, {
                metadata: { email, reason: 'Senha incorreta' },
                userId: 'system',
                userEmail: email,
            });
            return reply.status(401).send({ message: error.message });
        }
        // Erro genérico de credenciais inválidas
        if (error.message === 'Credenciais inválidas') {
            await logAudit(request, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'Auth', `Tentativa de login falhada: ${email}`, {
                metadata: { email, reason: 'Credenciais inválidas' },
                userId: 'system',
                userEmail: email,
            });
            return reply.status(401).send({ message: 'Credenciais inválidas' });
        }
        throw error;
    }
}
