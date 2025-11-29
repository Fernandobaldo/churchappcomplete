import { NoticeController } from '../controllers/noticeController';
import { checkPermission } from '../middlewares/checkPermission';
import { checkRole } from '../middlewares/checkRole';
import { checkBranchId } from '../middlewares/checkBranchId';
import { createNoticeSchema } from '../schemas/noticeSchemas';
import { authenticate } from '../middlewares/authenticate';
export async function noticesRoutes(app) {
    const controller = new NoticeController();
    app.get('/', {
        preHandler: [authenticate],
        schema: {
            description: 'Lista todos os avisos da filial do usuário',
            tags: ['Avisos'],
            summary: 'Listar avisos',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'Lista de avisos',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            message: { type: 'string' },
                            viewedBy: { type: 'array', items: { type: 'string' } },
                            branchId: { type: 'string' },
                            read: { type: 'boolean', description: 'Indica se o aviso foi lido pelo usuário autenticado' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                        additionalProperties: true,
                    },
                },
            },
        },
    }, controller.getAll.bind(controller));
    app.post('/', {
        preHandler: [
            authenticate,
            checkBranchId(),
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['members_manage']), // Usando members_manage como permissão para criar avisos
        ],
        schema: createNoticeSchema,
    }, controller.create.bind(controller));
    app.post('/:id/read', {
        preHandler: [authenticate],
        schema: {
            description: 'Marca um aviso como lido pelo usuário autenticado',
            tags: ['Avisos'],
            summary: 'Marcar aviso como lido',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do aviso',
                    },
                },
            },
            response: {
                200: {
                    description: 'Aviso marcado como lido',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                404: {
                    description: 'Aviso não encontrado',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, controller.markAsRead.bind(controller));
}
