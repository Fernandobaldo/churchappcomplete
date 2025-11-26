import { FastifyInstance } from 'fastify';
import {
  createBranchHandler,
  listBranchesHandler,
  deleteBranchHandler,
} from '../controllers/branchController';
import { authenticate } from '../middlewares/authenticate';
import { checkRole } from '../middlewares/checkRole';

export async function branchesRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [authenticate],
    schema: {
      description: `
Cria uma nova filial (branch).

**Validações aplicadas**:
- ✅ Apenas ADMINGERAL pode criar branches
- ✅ Verifica se a igreja pertence ao usuário
- ✅ Verifica limite de branches do plano (maxBranches)
      `,
      tags: ['Filiais'],
      summary: 'Criar nova filial',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'churchId'],
        properties: {
          name: {
            type: 'string',
            description: 'Nome da filial',
          },
          churchId: {
            type: 'string',
            description: 'ID da igreja à qual a filial pertence',
          },
        },
      },
      response: {
        201: {
          description: 'Filial criada com sucesso',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            churchId: { type: 'string' },
            isMainBranch: { type: 'boolean' },
          },
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
      },
    },
  }, createBranchHandler);

  app.get('/', {
    preHandler: [authenticate],
    schema: {
      description: 'Lista todas as filiais',
      tags: ['Filiais'],
      summary: 'Listar filiais',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Lista de filiais',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              pastorName: { type: 'string' },
              churchId: { type: 'string' },
              isMainBranch: { type: 'boolean' },
            },
          },
        },
      },
    },
  }, listBranchesHandler);

  app.delete('/:id', {
    preHandler: [
      authenticate,
      checkRole(['ADMINGERAL', 'ADMINFILIAL']), // Apenas admins podem deletar branches
    ],
    schema: {
      description: 'Deleta uma filial. Não é permitido deletar a filial principal (isMainBranch: true)',
      tags: ['Filiais'],
      summary: 'Deletar filial',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'ID da filial',
          },
        },
      },
      response: {
        200: {
          description: 'Filial deletada com sucesso',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          description: 'Erro de validação (ex: tentar deletar filial principal)',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          description: 'Filial não encontrada',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, deleteBranchHandler);
}
