import { FastifyInstance } from 'fastify'
import {
  getAuditLogsHandler,
  getMemberAuditLogsHandler,
  getBranchAuditLogsHandler,
  getMyAuditLogsHandler,
} from '../controllers/auditController'

export async function auditRoutes(app: FastifyInstance) {
  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      description: `
Lista logs de auditoria com filtros.

**Acesso**: Apenas ADMINGERAL pode visualizar todos os logs.

**Filtros disponíveis**:
- \`userId\`: Filtrar por usuário
- \`entityType\`: Filtrar por tipo de entidade (Member, Branch, Church, etc.)
- \`entityId\`: Filtrar por ID da entidade
- \`action\`: Filtrar por ação (MEMBER_CREATED, BRANCH_CREATED, etc.)
- \`startDate\`: Data inicial (ISO string)
- \`endDate\`: Data final (ISO string)
- \`limit\`: Limite de resultados (padrão: 100, máximo: 1000)
- \`offset\`: Offset para paginação (padrão: 0)
      `,
      tags: ['Auditoria'],
      summary: 'Listar logs de auditoria',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          action: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          description: 'Lista de logs de auditoria',
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  action: { type: 'string' },
                  entityType: { type: 'string' },
                  entityId: { type: 'string', nullable: true },
                  userId: { type: 'string' },
                  userEmail: { type: 'string' },
                  userRole: { type: 'string', nullable: true },
                  description: { type: 'string' },
                  metadata: { type: 'object', nullable: true },
                  ipAddress: { type: 'string', nullable: true },
                  userAgent: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
        403: {
          description: 'Sem permissão',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, getAuditLogsHandler)

  app.get('/members/:id', {
    preHandler: [app.authenticate],
    schema: {
      description: `
Lista logs de auditoria de um membro específico.

**Acesso**:
- ADMINGERAL: Pode ver logs de qualquer membro da igreja
- Outros: Podem ver apenas seus próprios logs
      `,
      tags: ['Auditoria'],
      summary: 'Listar logs de um membro',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do membro' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
        },
      },
      response: {
        200: {
          description: 'Lista de logs do membro',
          type: 'object',
          properties: {
            logs: { type: 'array' },
            total: { type: 'integer' },
          },
        },
      },
    },
  }, getMemberAuditLogsHandler)

  app.get('/branches/:id', {
    preHandler: [app.authenticate],
    schema: {
      description: 'Lista logs de auditoria de uma filial específica. Apenas ADMINGERAL pode acessar.',
      tags: ['Auditoria'],
      summary: 'Listar logs de uma filial',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID da filial' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
        },
      },
      response: {
        200: {
          description: 'Lista de logs da filial',
          type: 'object',
          properties: {
            logs: { type: 'array' },
            total: { type: 'integer' },
          },
        },
      },
    },
  }, getBranchAuditLogsHandler)

  app.get('/me', {
    preHandler: [app.authenticate],
    schema: {
      description: 'Lista logs de auditoria do usuário autenticado',
      tags: ['Auditoria'],
      summary: 'Listar meus logs',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
        },
      },
      response: {
        200: {
          description: 'Lista de logs do usuário',
          type: 'object',
          properties: {
            logs: { type: 'array' },
            total: { type: 'integer' },
          },
        },
      },
    },
  }, getMyAuditLogsHandler)
}

