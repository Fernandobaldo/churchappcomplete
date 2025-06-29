import { FastifyInstance } from 'fastify'
import { checkRole } from '../middlewares/checkRole'
import { checkPermission } from '../middlewares/checkPermission'
import { DevotionalController } from '../controllers/devotionalController'
import { createDevotionalSchema } from '../schemas/devotionalSchemas'

export async function devotionalsRoutes(app: FastifyInstance) {
  const controller = new DevotionalController()

  app.get('/', { preHandler: [app.authenticate] }, controller.getAll)

  app.post('/', {
    preHandler: [
      app.authenticate,
      checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
      checkPermission(['events_manage']),
    ],
    schema: createDevotionalSchema
  }, controller.create)

  app.post('/:id/like', {
    preHandler: [app.authenticate],
  }, controller.like)

  app.delete('/:id/unlike', {
    preHandler: [app.authenticate],
  }, controller.unlike)
}
