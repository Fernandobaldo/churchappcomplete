import { getAllMembers, getMemberById, getMyProfile, updateMemberById, updateMemberRoleById } from '../controllers/memberController';
export async function membersRoutes(app) {
    app.get('/', {
        preHandler: [app.authenticate],
        schema: {
            description: `
Lista todos os membros.

**Filtros automáticos por role**:
- **ADMINGERAL**: Vê todos os membros da igreja
- **ADMINFILIAL/COORDINATOR**: Vê apenas membros da sua filial
- **MEMBER**: Vê apenas a si mesmo
      `,
            tags: ['Membros'],
            summary: 'Listar membros',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'Lista de membros',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                            branchId: { type: 'string' },
                            avatarUrl: { type: ['string', 'null'] },
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
                },
                401: {
                    description: 'Não autenticado',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, getAllMembers);
    app.get('/me', {
        preHandler: [app.authenticate],
        schema: {
            description: 'Retorna o perfil do usuário autenticado',
            tags: ['Membros'],
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
                        phone: { type: ['string', 'null'] },
                        address: { type: ['string', 'null'] },
                        birthDate: { type: ['string', 'null'] },
                        avatarUrl: { type: ['string', 'null'] },
                        role: { type: 'string' },
                        branchId: { type: 'string' },
                        positionId: { type: ['string', 'null'] },
                        position: {
                            type: ['object', 'null'],
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                            },
                        },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string' },
                                },
                            },
                        },
                        branch: {
                            type: ['object', 'null'],
                        },
                    },
                    additionalProperties: true, // Permite campos adicionais não definidos no schema
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
    app.get('/:id', {
        preHandler: [app.authenticate],
        schema: {
            description: `
Obtém um membro específico por ID.

**Validações de acesso**:
- **ADMINGERAL**: Pode ver qualquer membro da igreja
- **ADMINFILIAL/COORDINATOR**: Pode ver apenas membros da sua filial
- **MEMBER**: Pode ver apenas a si mesmo
      `,
            tags: ['Membros'],
            summary: 'Obter membro por ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do membro',
                    },
                },
            },
            response: {
                200: {
                    description: 'Dados do membro',
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
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string' },
                                },
                            },
                        },
                        branch: {
                            type: 'object',
                            nullable: true,
                        },
                    },
                    additionalProperties: true, // Permite campos adicionais não definidos no schema
                },
                403: {
                    description: 'Sem permissão para visualizar este membro',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                404: {
                    description: 'Membro não encontrado',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, getMemberById);
    app.put('/:id', {
        preHandler: [app.authenticate],
        schema: {
            description: `
Atualiza um membro.

**Validações de acesso**:
- **ADMINGERAL**: Pode editar qualquer membro da igreja
- **ADMINFILIAL**: Pode editar apenas membros da sua filial
- **Outros roles**: Podem editar apenas a si mesmos
      `,
            tags: ['Membros'],
            summary: 'Atualizar membro',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do membro',
                    },
                },
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    birthDate: {
                        type: 'string',
                        description: 'Data de nascimento (formato: dd/MM/yyyy)',
                    },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                    avatarUrl: {
                        type: ['string', 'null'],
                        description: 'URL do avatar do membro (pode ser null ou string vazia). Se fornecido, deve ser uma URI válida.',
                    },
                    positionId: {
                        type: ['string', 'null'],
                        description: 'ID do cargo do membro (pode ser null)',
                    },
                },
            },
            response: {
                200: {
                    description: 'Membro atualizado com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string', nullable: true },
                        address: { type: 'string', nullable: true },
                        avatarUrl: { type: 'string', nullable: true },
                        birthDate: { type: 'string', nullable: true },
                        positionId: { type: 'string', nullable: true },
                    },
                },
                400: {
                    description: 'Erro de validação',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                403: {
                    description: 'Sem permissão para editar este membro',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, updateMemberById);
    app.patch('/:id/role', {
        preHandler: [app.authenticate],
        schema: {
            description: `
Atualiza a role de um membro e atribui permissões padrão.

**Validações de acesso**:
- **ADMINGERAL**: Pode alterar roles de qualquer membro da igreja (exceto criar outro ADMINGERAL)
- **ADMINFILIAL**: Pode alterar roles de membros da sua filial (apenas para COORDINATOR ou MEMBER)
- **Outros roles**: Não podem alterar roles

**Permissões padrão por role**:
- **ADMINGERAL/ADMINFILIAL**: Recebem todas as permissões automaticamente
- **COORDINATOR/MEMBER**: Mantêm apenas members_view
      `,
            tags: ['Membros'],
            summary: 'Atualizar role do membro',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do membro',
                    },
                },
            },
            body: {
                type: 'object',
                required: ['role'],
                properties: {
                    role: {
                        type: 'string',
                        enum: ['MEMBER', 'COORDINATOR', 'ADMINFILIAL', 'ADMINGERAL'],
                        description: 'Nova role do membro',
                    },
                },
            },
            response: {
                200: {
                    description: 'Role atualizada com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                400: {
                    description: 'Erro de validação',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'array' },
                    },
                },
                403: {
                    description: 'Sem permissão para alterar role deste membro',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                404: {
                    description: 'Membro não encontrado',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, updateMemberRoleById);
}
