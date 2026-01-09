import { FastifyInstance } from 'fastify'
import { OnboardingController } from '../controllers/onboardingController'

const controller = new OnboardingController()

export async function onboardingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate) // Protege todas as rotas abaixo

  app.get('/state', controller.getState.bind(controller))
  app.get('/progress', controller.getProgress.bind(controller))
  app.post('/progress/:step', controller.markStepComplete.bind(controller))
  app.post('/complete', controller.markComplete.bind(controller))
}

