import { FastifyInstance } from 'fastify'
import { checkRole } from '../middlewares/checkRole'
import { checkPermission } from '../middlewares/checkPermission'
import { DevotionalController } from '../controllers/devotionalController'
import { createDevotionalSchema } from '../schemas/devotionalSchemas'

export async function devotionalsRoutes(app: FastifyInstance) {
  const controller = new DevotionalController()

  app.get('/', { preHandler: [app.authenticate] }, controller.getAll.bind(controller))

  app.post('/', {
    preHandler: [
      app.authenticate,
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['devotional_manage']),
    ],
    schema: createDevotionalSchema
  }, controller.create.bind(controller))

  app.post('/:id/like', {
    preHandler: [app.authenticate],
  }, controller.like.bind(controller))

  app.delete('/:id/unlike', {
    preHandler: [app.authenticate],
  }, controller.unlike.bind(controller))
}
