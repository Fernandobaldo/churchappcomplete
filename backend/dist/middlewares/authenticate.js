import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { env } from '../env';
// Carrega .env.test se estiver em ambiente de teste
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    dotenv.config({ path: '.env.test' });
}
else {
    dotenv.config();
}
// Usa o mesmo JWT_SECRET que o fastifyJwt está usando (vem de env.ts)
// Isso garante que tokens criados com request.server.jwt.sign() sejam validados corretamente
const JWT_SECRET = env.JWT_SECRET;
export async function authenticate(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send({ message: 'Token ausente' });
        return;
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        request.user = {
            id: payload.sub,
            userId: payload.userId || payload.sub,
            email: payload.email,
            type: payload.type || 'user',
            permissions: payload.permissions || [],
            role: payload.role || null,
            branchId: payload.branchId || null,
            memberId: payload.memberId || null,
            churchId: payload.churchId || null,
        };
    }
    catch (error) {
        reply.status(401).send({ message: 'Token inválido' });
        return;
    }
}
