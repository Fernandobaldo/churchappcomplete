import { FastifyInstance } from 'fastify'
import { ContributionController } from '../controllers/contributionController'
import { checkPermission } from '../middlewares/checkPermission'
import { checkRole } from '../middlewares/checkRole'
import { checkBranchId } from '../middlewares/checkBranchId'
import { createContributionSchema, updateContributionSchema } from '../schemas/contributionSchemas'
import { authenticate } from '../middlewares/authenticate'

export async function contributionsRoutes(app: FastifyInstance) {
  const controller = new ContributionController()

  app.get('/', { preHandler: [authenticate] }, controller.getAll.bind(controller))

  app.get('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Obtém uma contribuição específica por ID',
      tags: ['Contribuições'],
      summary: 'Obter contribuição por ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'ID da contribuição',
          },
        },
      },
      response: {
        200: {
          description: 'Dados da contribuição',
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            goal: { type: 'number', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            raised: { type: 'number', nullable: true },
            isActive: { type: 'boolean' },
            branchId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            PaymentMethods: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        404: {
          description: 'Contribuição não encontrada',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        403: {
          description: 'Sem permissão para visualizar esta contribuição',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, controller.getById.bind(controller))

  app.post('/', {
    preHandler: [
      authenticate,
      checkBranchId(), // Verifica branchId antes dos middlewares de permissão
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['contributions_manage'])
    ],
    schema: createContributionSchema
  }, controller.create.bind(controller))

  app.put('/:id', {
    preHandler: [
      authenticate,
      checkBranchId(),
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['contributions_manage'])
    ],
    schema: {
      ...updateContributionSchema,
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'ID da contribuição',
          },
        },
      },
    },
  }, controller.update.bind(controller))

  app.patch('/:id/toggle-active', {
    preHandler: [
      authenticate,
      checkBranchId(),
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['contributions_manage'])
    ],
    schema: {
      description: 'Ativa ou desativa uma campanha de contribuição',
      tags: ['Contribuições'],
      summary: 'Alternar status ativo/inativo da campanha',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'ID da contribuição',
          },
        },
      },
      response: {
        200: {
          description: 'Status da campanha alterado com sucesso',
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        404: {
          description: 'Contribuição não encontrada',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        403: {
          description: 'Sem permissão para alterar esta contribuição',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, controller.toggleActive.bind(controller))
}
