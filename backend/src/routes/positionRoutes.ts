import { FastifyInstance } from 'fastify'
import { PositionController } from '../controllers/positionController'

const positionController = new PositionController()

export async function positionRoutes(app: FastifyInstance) {
  app.get(
    '/positions',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Listar todos os cargos da igreja',
        tags: ['Cargos'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                churchId: { type: 'string' },
                isDefault: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                _count: {
                  type: 'object',
                  properties: {
                    Members: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    positionController.getAll.bind(positionController)
  )

  app.post(
    '/positions',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Criar novo cargo (apenas ADMINGERAL)',
        tags: ['Cargos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              churchId: { type: 'string' },
              isDefault: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    positionController.create.bind(positionController)
  )

  app.put(
    '/positions/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Atualizar cargo (apenas ADMINGERAL)',
        tags: ['Cargos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    positionController.update.bind(positionController)
  )

  app.delete(
    '/positions/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        description: 'Deletar cargo (apenas ADMINGERAL)',
        tags: ['Cargos'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    positionController.delete.bind(positionController)
  )
}
