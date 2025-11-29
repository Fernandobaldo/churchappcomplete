import { z } from 'zod';
export const createTransactionBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório'),
    amount: z.number().positive('Valor deve ser positivo'),
    type: z.enum(['ENTRY', 'EXIT'], {
        errorMap: () => ({ message: 'Tipo deve ser ENTRY ou EXIT' }),
    }),
    category: z.string().optional(),
});
export const createTransactionSchema = {
    summary: 'Criar uma nova transação financeira',
    tags: ['Finanças'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
            category: { type: 'string' },
        },
        required: ['title', 'amount', 'type'],
    },
    response: {
        201: {
            description: 'Transação criada com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                amount: { type: 'number' },
                type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
                category: { type: 'string', nullable: true },
                branchId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    },
};
