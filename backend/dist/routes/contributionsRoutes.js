import { ContributionController } from '../controllers/contributionController';
import { checkPermission } from '../middlewares/checkPermission';
import { checkRole } from '../middlewares/checkRole';
import { checkBranchId } from '../middlewares/checkBranchId';
import { createContributionSchema } from '../schemas/contributionSchemas';
import { authenticate } from '../middlewares/authenticate';
export async function contributionsRoutes(app) {
    const controller = new ContributionController();
    app.get('/', { preHandler: [authenticate] }, controller.getAll.bind(controller));
    app.get('/:id', {
        preHandler: [authenticate],
        schema: {
            description: 'Obtém uma contribuição específica por ID',
            tags: ['Contribuições'],
            summary: 'Obter contribuição por ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID da contribuição',
                    },
                },
            },
            response: {
                200: {
                    description: 'Dados da contribuição',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        value: { type: 'number' },
                        date: { type: 'string', format: 'date-time' },
                        type: { type: 'string' },
                        goal: { type: 'number', nullable: true },
                        raised: { type: 'number', nullable: true },
                        bankName: { type: 'string', nullable: true },
                        agency: { type: 'string', nullable: true },
                        accountName: { type: 'string', nullable: true },
                        qrCodeUrl: { type: 'string', nullable: true },
                        paymentLink: { type: 'string', nullable: true },
                        branchId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                404: {
                    description: 'Contribuição não encontrada',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                403: {
                    description: 'Sem permissão para visualizar esta contribuição',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, controller.getById.bind(controller));
    app.post('/', {
        preHandler: [
            authenticate,
            checkBranchId(), // Verifica branchId antes dos middlewares de permissão
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['contributions_manage'])
        ],
        schema: createContributionSchema
    }, controller.create.bind(controller));
    app.get('/types', controller.getTypes.bind(controller));
}
