import { FastifyInstance } from 'fastify';
import {
getMySubscriptionHandler,
listAllSubscriptionsHandler,
changePlanHandler
} from '../controllers/subscriptionController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

export async function subscriptionRoutes(app: FastifyInstance) {
  // Rota para obter assinatura do usuário autenticado
  // Será /subscriptions/me quando registrado com prefixo /subscriptions
  app.get(
    '/me',
    { preHandler: [authenticate] },
    getMySubscriptionHandler
  );

  // Alias para /subscriptions/current (compatibilidade com frontend)
  app.get(
    '/current',
    { preHandler: [authenticate] },
    getMySubscriptionHandler
  );

  // Rota para trocar de plano
  app.post(
    '/change',
    { preHandler: [authenticate] },
    changePlanHandler
  );

  // Rota para listar todas as assinaturas (admin)
  app.get(
    '/',
    { preHandler: [authenticate, authorize(['SAAS_ADMIN'])] },
    listAllSubscriptionsHandler
  );
}
