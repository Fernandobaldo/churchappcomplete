import { z } from 'zod';
export const createNoticeBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório'),
    message: z.string().min(1, 'Mensagem obrigatória'),
});
export const createNoticeSchema = {
    summary: 'Criar um novo aviso',
    tags: ['Avisos'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            message: { type: 'string' },
        },
        required: ['title', 'message'],
    },
    response: {
        201: {
            description: 'Aviso criado com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                branchId: { type: 'string' },
                viewedBy: { type: 'array', items: { type: 'string' } },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    },
};
