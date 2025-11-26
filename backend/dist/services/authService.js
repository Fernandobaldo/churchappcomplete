import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// Importa prisma DEPOIS de garantir que o .env.test está carregado
// Isso garante que o Prisma Client seja criado com a DATABASE_URL correta
import dotenv from 'dotenv';
// Carrega .env.test se estiver em ambiente de teste
// IMPORTANTE: Deve ser carregado ANTES de importar o prisma
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    dotenv.config({ path: '.env.test' });
}
else {
    dotenv.config();
}
// Importa prisma DEPOIS de carregar o .env
import { prisma } from '../lib/prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key';
export class AuthService {
    async validateCredentials(email, password) {
        // Debug em ambiente de teste
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            console.log(`[AUTH DEBUG] Validando credenciais para: ${email}`);
            // Verifica qual banco está sendo usado
            const dbUrl = process.env.DATABASE_URL;
            if (dbUrl) {
                console.log(`[AUTH DEBUG] DATABASE_URL: ${dbUrl.includes('churchapp_test') ? 'TESTE ✅' : 'OUTRO ⚠️'}`);
            }
        }
        // Verifica se o Prisma está conectado
        try {
            await prisma.$connect();
        }
        catch (error) {
            console.error('[AUTH DEBUG] Erro ao conectar Prisma:', error);
        }
        // NOVO MODELO: Sempre valida como User primeiro
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                Member: {
                    include: {
                        Permission: true,
                        Branch: {
                            include: {
                                Church: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
                console.log(`[AUTH DEBUG] ❌ User NÃO encontrado para: ${email}`);
            }
            return null;
        }
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            console.log(`[AUTH DEBUG] ✅ User encontrado: ${user.email} (ID: ${user.id})`);
        }
        // Valida senha do User
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            console.log(`[AUTH DEBUG] 🔑 Senha do user corresponde: ${passwordMatch}`);
        }
        if (!passwordMatch) {
            return null;
        }
        // Se User tem Member associado, retorna dados do Member
        if (user.Member) {
            if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
                console.log(`[AUTH DEBUG] ✅ Member associado encontrado: ${user.Member.id} (Role: ${user.Member.role})`);
            }
            return {
                type: 'member',
                user,
                member: user.Member,
            };
        }
        // Se não tem Member, retorna apenas User
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            console.log(`[AUTH DEBUG] ✅ User sem Member associado`);
        }
        return {
            type: 'user',
            user,
            member: null,
        };
    }
    async login(email, password) {
        const result = await this.validateCredentials(email, password);
        if (!result)
            throw new Error('Credenciais inválidas');
        const { type, user, member } = result;
        // Monta payload do token
        const tokenPayload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            type: type,
        };
        // Se tem Member, adiciona contexto da igreja
        if (member) {
            tokenPayload.memberId = member.id;
            tokenPayload.role = member.role;
            tokenPayload.branchId = member.branchId;
            tokenPayload.churchId = member.Branch?.Church?.id || null;
            tokenPayload.permissions = member.Permission?.map(p => p.type) || [];
        }
        else {
            tokenPayload.memberId = null;
            tokenPayload.role = null;
            tokenPayload.branchId = null;
            tokenPayload.churchId = null;
            tokenPayload.permissions = [];
        }
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
        // Monta resposta
        const responseUser = {
            id: user.id,
            name: user.name,
            email: user.email,
        };
        if (member) {
            responseUser.memberId = member.id;
            responseUser.role = member.role;
            responseUser.branchId = member.branchId;
            responseUser.churchId = member.Branch?.Church?.id || null;
            responseUser.permissions = member.Permission?.map(p => ({ type: p.type })) || [];
        }
        return {
            token,
            type,
            user: responseUser,
        };
    }
}
