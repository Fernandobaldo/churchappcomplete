import { FastifyInstance } from 'fastify';
import { registerRoute } from './register';
import { loginRoute } from './login';
import { permissionsRoutes } from './permissions';
import { getMyProfile } from '../../controllers/memberController';

export async function authRoutes(app: FastifyInstance) {
    await registerRoute(app);
    await loginRoute(app);
    await permissionsRoutes(app);
    
    // Endpoint /auth/me para compatibilidade com mobile
    app.get('/me', {
        preHandler: [app.authenticate],
        schema: {
            description: 'Retorna o perfil do usuário autenticado. Compatível com mobile.',
            tags: ['Autenticação'],
            summary: 'Obter meu perfil',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'Perfil do usuário',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        branchId: { type: 'string' },
                        birthDate: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        address: { type: 'string', nullable: true },
                        avatarUrl: { type: 'string', nullable: true },
                    },
                },
                404: {
                    description: 'Usuário não encontrado',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, getMyProfile);
    
    console.log('🔑 LoginRoute foi executado!');
}