import { FastifyInstance } from 'fastify';
import {
getAllUsersHandler,
getAllChurchesHandler,
getAllSubscriptionsHandler,
getDashboardOverviewHandler
} from '../controllers/adminController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

export async function adminRoutes(app: FastifyInstance) {
  app.get('/admin/users', {
    preHandler: [authenticate, authorize(['SAAS_ADMIN'])],
    handler: getAllUsersHandler,
  });

  app.get('/admin/churches', {
    preHandler: [authenticate, authorize(['SAAS_ADMIN'])],
    handler: getAllChurchesHandler,
  });

  app.get('/admin/subscriptions', {
    preHandler: [authenticate, authorize(['SAAS_ADMIN'])],
    handler: getAllSubscriptionsHandler,
  });

  app.get('/admin/dashboard/overview', {
    preHandler: [authenticate, authorize(['SAAS_ADMIN'])],
    handler: getDashboardOverviewHandler,
  });
}
