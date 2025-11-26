import { publicRegisterController } from '../../controllers/public/publicRegisterController';
export async function publicRegisterRoute(app) {
    app.post('/register', {
        schema: {
            description: `
Registro público para novos usuários na landing page.

Cria um User e associa automaticamente ao plano Free.

**Fluxo**:
1. Cria User no sistema
2. Cria Subscription com plano Free
3. Retorna token JWT para login imediato

**Nota**: Este endpoint não requer autenticação e é usado apenas para registro inicial.
      `,
            tags: ['Autenticação'],
            summary: 'Registro público (landing page)',
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nome do responsável',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email único',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        minLength: 6,
                        description: 'Senha (mínimo 6 caracteres)',
                    },
                },
            },
            response: {
                201: {
                    description: 'Usuário criado com sucesso',
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                            },
                        },
                        token: {
                            type: 'string',
                            description: 'Token JWT para autenticação',
                        },
                    },
                },
                400: {
                    description: 'Erro de validação',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, publicRegisterController);
}
