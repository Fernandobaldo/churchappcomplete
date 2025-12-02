import { FastifyInstance } from 'fastify'
import {
getAllPermissionsController,
assignPermissionsController
} from '../../controllers/auth/permissionsController'
import { checkRole } from '../../middlewares/checkRole'

export async function permissionsRoutes(app: FastifyInstance) {
  app.get('/all', {
    preHandler: [app.authenticate, checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR'])],
  }, getAllPermissionsController)

  // Apenas ADMINGERAL e ADMINFILIAL podem atribuir permissões
  app.post('/:id', {
    preHandler: [app.authenticate, checkRole(['ADMINGERAL', 'ADMINFILIAL'])],
  }, assignPermissionsController)
}
