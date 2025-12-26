import { FastifyInstance } from 'fastify';
import {
createPlanHandler,
listPlansHandler
} from '../controllers/planController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

export async function planRoutes(app: FastifyInstance) {
  // Rota pública para listar planos (cliente selecionar)
  // Será /plans quando registrado com prefixo /plans
  app.get(
    '/',
    listPlansHandler
  );

  // Rota autenticada para criar planos (admin)
  app.post(
    '/',
    { preHandler: [authenticate, authorize(['SAAS_ADMIN'])] },
    createPlanHandler
  );
}
