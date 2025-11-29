import { FastifyInstance } from 'fastify'
import { FinanceController } from '../controllers/financeController'
import { checkPermission } from '../middlewares/checkPermission'
import { checkRole } from '../middlewares/checkRole'
import { checkBranchId } from '../middlewares/checkBranchId'
import { createTransactionSchema } from '../schemas/financeSchemas'
import { authenticate } from '../middlewares/authenticate'

export async function financesRoutes(app: FastifyInstance) {
  const controller = new FinanceController()

  app.get('/', {
    preHandler: [authenticate],
    schema: {
      description: 'Lista transações financeiras com resumo (total, entradas, saídas)',
      tags: ['Finanças'],
      summary: 'Listar transações e resumo financeiro',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Transações e resumo financeiro',
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  amount: { type: 'number' },
                  type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
                  category: { type: 'string', nullable: true },
                  branchId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                entries: { type: 'number' },
                exits: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, controller.getAll.bind(controller))

  app.post('/', {
    preHandler: [
      authenticate,
      checkBranchId(),
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['finances_manage']),
    ],
    // Schema removido - validação feita no controller com Zod
    // Isso permite que o controller retorne o formato de erro correto
  }, controller.create.bind(controller))
}

