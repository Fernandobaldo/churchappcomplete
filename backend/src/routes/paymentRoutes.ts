import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'
import { createCheckoutHandler } from '../controllers/payment/checkoutController'
import { webhookHandler } from '../controllers/payment/webhookController'
import {
  getSubscriptionHandler,
  cancelSubscriptionHandler,
  resumeSubscriptionHandler,
} from '../controllers/payment/subscriptionController'

export async function paymentRoutes(app: FastifyInstance) {
  // Rotas autenticadas
  app.post(
    '/subscriptions/checkout',
    { preHandler: [authenticate] },
    createCheckoutHandler
  )

  app.get(
    '/subscriptions',
    { preHandler: [authenticate] },
    getSubscriptionHandler
  )

  app.post(
    '/subscriptions/cancel',
    { preHandler: [authenticate] },
    cancelSubscriptionHandler
  )

  app.post(
    '/subscriptions/resume',
    { preHandler: [authenticate] },
    resumeSubscriptionHandler
  )

  // Webhooks (sem autenticação, mas com validação de assinatura)
  app.post(
    '/webhooks/payment/:provider',
    webhookHandler
  )
}





