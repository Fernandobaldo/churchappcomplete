import { FastifyInstance } from 'fastify';
import {
createPlanHandler,
listPlansHandler
} from '../controllers/planController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

export async function planRoutes(app: FastifyInstance) {
  app.post(
    '/plans',
    { preHandler: [authenticate, authorize(['SAAS_ADMIN'])] },
    createPlanHandler
  );

  app.get(
    '/plans',
    { preHandler: [authenticate] },
    listPlansHandler
  );
}
