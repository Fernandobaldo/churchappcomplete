import { z } from 'zod';
// Garante que o .env.test está carregado antes de importar o AuthService
import dotenv from 'dotenv';
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    dotenv.config({ path: '.env.test' });
}
else {
    dotenv.config();
}
import { AuthService } from '../../services/authService';
export async function loginRoute(app) {
    const authService = new AuthService();
    app.post('/login', {
        schema: {
            description: `
Autentica um usuário (User ou Member) e retorna um token JWT.

O token JWT contém:
- \`sub\`: ID do usuário
- \`userId\`: ID do usuário
- \`email\`: Email do usuário
- \`memberId\`: ID do membro (se aplicável)
- \`role\`: Role do membro (se aplicável)
- \`branchId\`: ID da filial (se aplicável)
- \`permissions\`: Lista de permissões (se aplicável)

Use este token no header \`Authorization: Bearer <token>\` para acessar endpoints protegidos.
      `,
            tags: ['Autenticação'],
            summary: 'Fazer login',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email do usuário',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        description: 'Senha do usuário',
                    },
                },
            },
            response: {
                200: {
                    description: 'Login realizado com sucesso',
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'Token JWT para autenticação',
                        },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string' },
                                memberId: { type: 'string', nullable: true },
                                role: { type: 'string', nullable: true },
                                branchId: { type: 'string', nullable: true },
                                churchId: { type: 'string', nullable: true },
                                permissions: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            type: { type: 'string' },
                                        },
                                    },
                                    nullable: true,
                                },
                            },
                        },
                        type: {
                            type: 'string',
                            enum: ['user', 'member'],
                            description: 'Tipo de usuário autenticado',
                        },
                    },
                },
                401: {
                    description: 'Credenciais inválidas',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                400: {
                    description: 'Erro de validação',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const bodySchema = z.object({
            email: z.string().email(),
            password: z.string(),
        });
        const { email, password } = bodySchema.parse(request.body);
        try {
            const { token, user, type } = await authService.login(email, password);
            return reply.send({ token, user, type });
        }
        catch (error) {
            return reply.status(401).send({ message: 'Credenciais inválidas' });
        }
    });
}
