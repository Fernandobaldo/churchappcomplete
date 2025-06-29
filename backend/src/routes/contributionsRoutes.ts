import { FastifyInstance } from 'fastify'
import { ContributionController } from '../controllers/contributionController'
import { checkPermission } from '../middlewares/checkPermission'
import { checkRole } from '../middlewares/checkRole'
import { createContributionSchema } from '../schemas/contributionSchemas'
import { authenticate } from '../middlewares/authenticate'

export async function contributionsRoutes(app: FastifyInstance) {
  const controller = new ContributionController()

  app.get('/', { preHandler: [authenticate] }, controller.getAll)

  app.post('/', {
    preHandler: [
      authenticate,
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['contribution_manage'])
    ],
    schema: createContributionSchema
  }, controller.create)

  app.get('/types', controller.getTypes)
}
