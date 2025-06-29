import { FastifyInstance } from 'fastify'
import { registerController } from '../../controllers/auth/registerController'

export async function registerRoute(app: FastifyInstance) {

  app.post('/', registerController)

  app.get('/types', async (request, reply) => {
    return [
      { label: 'Admin Geral', value: 'ADMINGERAL' },
      { label: 'Admin Congregação', value: 'ADMINFILIAL' },
      { label: 'Membro', value: 'MEMBER' },
    ]
  })
}
