import { ContributionController } from '../controllers/contributionController';
import { checkPermission } from '../middlewares/checkPermission';
import { checkRole } from '../middlewares/checkRole';
import { createContributionSchema } from '../schemas/contributionSchemas';
import { authenticate } from '../middlewares/authenticate';
export async function contributionsRoutes(app) {
    const controller = new ContributionController();
    app.get('/', { preHandler: [authenticate] }, controller.getAll.bind(controller));
    app.post('/', {
        preHandler: [
            authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['contributions_manage'])
        ],
        schema: createContributionSchema
    }, controller.create.bind(controller));
    app.get('/types', controller.getTypes.bind(controller));
}
