import { FastifyInstance } from 'fastify'
import {
getAllMembers,
getMemberById,
getMyProfile,
updateMemberById
} from '../controllers/memberController'

export async function membersRoutes(app: FastifyInstance) {
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
  }, getAllMembers)

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
            role: { type: 'string' },
            branchId: { type: 'string' },
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
  }, getMyProfile)

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
          },
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
  }, getMemberById)

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
          avatarUrl: { type: 'string', format: 'uri' },
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
  }, updateMemberById)
}
