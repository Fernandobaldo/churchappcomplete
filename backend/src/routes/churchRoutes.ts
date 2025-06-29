import { FastifyInstance } from 'fastify'
import { ChurchController } from '../controllers/churchController'

const controller = new ChurchController()

export async function churchRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate) // Protege todas as rotas abaixo

  app.post('/', controller.create.bind(controller))
  app.get('/', controller.getAll.bind(controller))
  app.get('/:id', controller.getById.bind(controller))
  app.put('/:id', controller.update.bind(controller))
  app.delete('/:id', controller.delete.bind(controller))
  app.patch('/:id/deactivate', controller.deactivate.bind(controller))
}
