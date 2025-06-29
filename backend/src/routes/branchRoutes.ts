import { FastifyInstance } from 'fastify';
import {
  createBranchHandler,
  listBranchesHandler,
  deleteBranchHandler,
} from '../controllers/branchController';
import { authenticate } from '../middlewares/authenticate';

export async function branchesRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [authenticate],
  }, createBranchHandler);

  app.get('/', {
    preHandler: [authenticate],
  }, listBranchesHandler);

  app.delete('/:id', {
    preHandler: [authenticate],
  }, deleteBranchHandler);
}
