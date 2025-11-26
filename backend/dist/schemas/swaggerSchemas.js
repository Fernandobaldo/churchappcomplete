/**
 * Schemas Swagger/OpenAPI para documentação da API
 */
export const swaggerSchemas = {
    // Schemas de Erro
    Error: {
        type: 'object',
        properties: {
            error: {
                type: 'string',
                description: 'Mensagem de erro',
            },
            details: {
                type: 'string',
                description: 'Detalhes adicionais do erro (opcional)',
            },
        },
    },
    // Schemas de Autenticação
    LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: {
                type: 'string',
                format: 'email',
                description: 'Email do usuário',
                example: 'admin@example.com',
            },
            password: {
                type: 'string',
                format: 'password',
                description: 'Senha do usuário',
                example: 'password123',
            },
        },
    },
    LoginResponse: {
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
                    role: { type: 'string', enum: ['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR', 'MEMBER'] },
                    branchId: { type: 'string' },
                    permissions: {
                        type: 'array',
                        items: { type: 'string' },
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
    // Schemas de Registro
    RegisterMemberRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'branchId'],
        properties: {
            name: {
                type: 'string',
                description: 'Nome completo do membro',
                example: 'João Silva',
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Email único do membro',
                example: 'joao@example.com',
            },
            password: {
                type: 'string',
                format: 'password',
                minLength: 6,
                description: 'Senha do membro (mínimo 6 caracteres)',
                example: 'password123',
            },
            branchId: {
                type: 'string',
                description: 'ID da filial onde o membro será criado',
                example: 'branch-123',
            },
            role: {
                type: 'string',
                enum: ['MEMBER', 'COORDINATOR', 'ADMINFILIAL'],
                default: 'MEMBER',
                description: 'Role do membro. ADMINGERAL não pode ser criado por usuários.',
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
                example: '1990-01-15',
            },
            phone: {
                type: 'string',
                description: 'Telefone do membro',
                example: '(11) 99999-9999',
            },
            address: {
                type: 'string',
                description: 'Endereço do membro',
                example: 'Rua Exemplo, 123',
            },
            avatarUrl: {
                type: 'string',
                format: 'uri',
                description: 'URL do avatar do membro',
                example: 'https://example.com/avatar.jpg',
            },
            fromLandingPage: {
                type: 'boolean',
                default: false,
                description: 'Indica se é registro público da landing page (não requer autenticação)',
            },
        },
    },
    RegisterPublicRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
            name: {
                type: 'string',
                description: 'Nome do responsável',
                example: 'João Silva',
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'Email único',
                example: 'joao@example.com',
            },
            password: {
                type: 'string',
                format: 'password',
                minLength: 6,
                description: 'Senha (mínimo 6 caracteres)',
                example: 'password123',
            },
        },
    },
    Member: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: {
                type: 'string',
                enum: ['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL'],
            },
            branchId: { type: 'string' },
            birthDate: { type: 'string', format: 'date', nullable: true },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
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
    },
    // Schemas de Branch
    CreateBranchRequest: {
        type: 'object',
        required: ['name', 'pastorName', 'churchId'],
        properties: {
            name: {
                type: 'string',
                description: 'Nome da filial',
                example: 'Filial Centro',
            },
            pastorName: {
                type: 'string',
                description: 'Nome do pastor responsável',
                example: 'Pr. João Silva',
            },
            churchId: {
                type: 'string',
                description: 'ID da igreja à qual a filial pertence',
                example: 'church-123',
            },
        },
    },
    Branch: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            pastorName: { type: 'string' },
            churchId: { type: 'string' },
            isMainBranch: { type: 'boolean' },
        },
    },
    // Schemas de Church
    CreateChurchRequest: {
        type: 'object',
        required: ['name'],
        properties: {
            name: {
                type: 'string',
                description: 'Nome da igreja',
                example: 'Igreja Exemplo',
            },
            logoUrl: {
                type: 'string',
                format: 'uri',
                description: 'URL do logo da igreja',
                example: 'https://example.com/logo.png',
            },
            branchName: {
                type: 'string',
                description: 'Nome da filial principal (padrão: "Sede")',
                example: 'Sede',
            },
            pastorName: {
                type: 'string',
                description: 'Nome do pastor responsável',
                example: 'Pr. João Silva',
            },
        },
    },
    Church: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            logoUrl: { type: 'string', nullable: true },
            branches: {
                type: 'array',
                items: { $ref: '#/components/schemas/Branch' },
            },
        },
    },
    // Schemas de Plan
    Plan: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            features: {
                type: 'array',
                items: { type: 'string' },
            },
            maxMembers: {
                type: 'integer',
                nullable: true,
                description: 'Limite de membros (null = ilimitado)',
            },
            maxBranches: {
                type: 'integer',
                nullable: true,
                description: 'Limite de filiais (null = ilimitado)',
            },
        },
    },
};
export const swaggerTags = [
    {
        name: 'Autenticação',
        description: 'Endpoints de autenticação e autorização',
    },
    {
        name: 'Membros',
        description: 'Gerenciamento de membros da igreja',
    },
    {
        name: 'Filiais',
        description: 'Gerenciamento de filiais (branches)',
    },
    {
        name: 'Igrejas',
        description: 'Gerenciamento de igrejas',
    },
    {
        name: 'Eventos',
        description: 'Gerenciamento de eventos',
    },
    {
        name: 'Devocionais',
        description: 'Gerenciamento de devocionais',
    },
    {
        name: 'Contribuições',
        description: 'Gerenciamento de contribuições',
    },
    {
        name: 'Planos',
        description: 'Gerenciamento de planos e assinaturas',
    },
    {
        name: 'Permissões',
        description: 'Gerenciamento de permissões granulares',
    },
    {
        name: 'Admin',
        description: 'Endpoints administrativos do SaaS',
    },
];
