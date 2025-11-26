import { registerController } from '../../controllers/auth/registerController';
import { authenticate } from '../../middlewares/authenticate';
export async function registerRoute(app) {
    // Rota pública para registro de landing page (fromLandingPage: true)
    // Rota autenticada para criação de membros internos
    app.post('/', {
        preHandler: async (request, reply) => {
            // Tenta ler o body para verificar se é registro público
            // No Fastify, o body pode não estar parseado ainda no preHandler
            // então tentamos ler de forma segura
            try {
                const body = request.body;
                // Se for landing page, não precisa autenticação
                if (body?.fromLandingPage === true) {
                    return; // Permite continuar sem autenticação
                }
            }
            catch (error) {
                // Se não conseguir ler o body, continua para autenticação
            }
            // Se não for landing page, exige autenticação
            // Mas só tenta autenticar se houver token no header
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                await authenticate(request, reply);
                // Se a autenticação falhar, o authenticate já enviou a resposta
                if (reply.sent) {
                    return;
                }
            }
            // Se não houver token, deixa o controller decidir (pode ser registro público)
        },
        schema: {
            description: `
Cria um novo membro ou usuário.

**Modo Público (fromLandingPage: true)**:
- Não requer autenticação
- Cria um User com plano Free
- Usado para registro na landing page

**Modo Interno (fromLandingPage: false ou omitido)**:
- Requer autenticação
- Cria um Member na filial especificada
- Validações aplicadas:
  - ✅ Verifica se o usuário tem permissão para criar membros
  - ✅ Verifica se a branch pertence à mesma igreja
  - ✅ Verifica se pode atribuir o role especificado
  - ✅ Verifica limite de membros do plano
      `,
            tags: ['Membros'],
            summary: 'Criar novo membro ou usuário',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nome completo do membro',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email único do membro',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        minLength: 6,
                        description: 'Senha do membro (mínimo 6 caracteres)',
                    },
                    branchId: {
                        type: 'string',
                        description: 'ID da filial onde o membro será criado (obrigatório para criação interna)',
                    },
                    role: {
                        type: 'string',
                        enum: ['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL'],
                        default: 'MEMBER',
                        description: 'Role do membro. ADMINGERAL não pode ser criado por usuários (será validado no controller).',
                    },
                    permissions: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: [
                                'devotional_manage',
                                'members_view',
                                'members_manage',
                                'events_manage',
                                'contributions_manage',
                                'finances_manage',
                            ],
                        },
                        description: 'Permissões granulares do membro',
                    },
                    birthDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Data de nascimento (formato ISO ou dd/MM/yyyy)',
                    },
                    phone: {
                        type: 'string',
                        description: 'Telefone do membro',
                    },
                    address: {
                        type: 'string',
                        description: 'Endereço do membro',
                    },
                    avatarUrl: {
                        type: 'string',
                        format: 'uri',
                        description: 'URL do avatar do membro',
                    },
                    fromLandingPage: {
                        type: 'boolean',
                        default: false,
                        description: 'Indica se é registro público da landing page (não requer autenticação)',
                    },
                },
            },
            response: {
                201: {
                    description: 'Membro criado com sucesso (registro interno) ou Usuário criado com sucesso (registro público)',
                    type: 'object',
                    properties: {
                        // Campos para registro público
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                            },
                        },
                        token: { type: 'string' },
                        // Campos para registro interno
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        branchId: { type: 'string' },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                    additionalProperties: true, // Permite campos adicionais não definidos no schema
                },
                400: {
                    description: 'Erro de validação',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                401: {
                    description: 'Não autenticado',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                403: {
                    description: 'Sem permissão ou limite excedido',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                500: {
                    description: 'Erro interno do servidor',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'string' },
                    },
                },
            },
        },
    }, registerController);
    app.get('/types', {
        schema: {
            description: 'Retorna os tipos de roles disponíveis para criação de membros',
            tags: ['Membros'],
            summary: 'Listar tipos de roles',
            response: {
                200: {
                    description: 'Lista de roles disponíveis',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            label: { type: 'string' },
                            value: { type: 'string' },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return [
            { label: 'Admin Geral', value: 'ADMINGERAL' },
            { label: 'Admin Congregação', value: 'ADMINFILIAL' },
            { label: 'Membro', value: 'MEMBER' },
        ];
    });
}
