import { checkRole } from '../middlewares/checkRole';
import { checkPermission } from '../middlewares/checkPermission';
import { DevotionalController } from '../controllers/devotionalController';
import { createDevotionalSchema } from '../schemas/devotionalSchemas';
export async function devotionalsRoutes(app) {
    const controller = new DevotionalController();
    app.get('/', { preHandler: [app.authenticate] }, controller.getAll.bind(controller));
    app.get('/:id', { preHandler: [app.authenticate] }, controller.getById.bind(controller));
    app.post('/', {
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['devotional_manage']),
        ],
        schema: createDevotionalSchema
    }, controller.create.bind(controller));
    app.post('/:id/like', {
        preHandler: [app.authenticate],
    }, controller.like.bind(controller));
    app.delete('/:id/unlike', {
        preHandler: [app.authenticate],
    }, controller.unlike.bind(controller));
    app.put('/:id', {
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['devotional_manage']),
        ],
        schema: {
            description: 'Atualiza um devocional. Apenas o autor ou usuários com permissão podem editar.',
            tags: ['Devocionais'],
            summary: 'Atualizar devocional',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do devocional',
                    },
                },
            },
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    passage: { type: 'string' },
                    content: { type: 'string' },
                },
            },
            response: {
                200: {
                    description: 'Devocional atualizado com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        passage: { type: 'string' },
                        content: { type: 'string', nullable: true },
                    },
                },
                403: {
                    description: 'Sem permissão para editar este devocional',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                404: {
                    description: 'Devocional não encontrado',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, controller.update.bind(controller));
    app.delete('/:id', {
        preHandler: [
            app.authenticate,
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['devotional_manage']),
        ],
        schema: {
            description: 'Deleta um devocional. Apenas o autor ou usuários com permissão podem deletar.',
            tags: ['Devocionais'],
            summary: 'Deletar devocional',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do devocional',
                    },
                },
            },
            response: {
                200: {
                    description: 'Devocional deletado com sucesso',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                403: {
                    description: 'Sem permissão para deletar este devocional',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                404: {
                    description: 'Devocional não encontrado',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, controller.delete.bind(controller));
}
