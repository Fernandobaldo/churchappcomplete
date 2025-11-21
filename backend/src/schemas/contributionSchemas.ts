import { z } from 'zod'

// Schema Zod para validação
export const createContributionBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório'),
    description: z.string().optional(),
    value: z.number().positive('Valor deve ser positivo'),
    date: z.string().datetime('Data inválida'),
    type: z.enum(['OFERTA', 'DIZIMO', 'OUTRO'], {
        errorMap: () => ({ message: 'Tipo deve ser OFERTA, DIZIMO ou OUTRO' }),
    }),
})

// Schema Fastify para documentação Swagger
export const createContributionSchema = {
    summary: 'Registrar uma nova contribuição',
    tags: ['Contribuições'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            value: { type: 'number' },
            date: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['OFERTA', 'DIZIMO', 'OUTRO'] },
        },
        required: ['title', 'value', 'date', 'type'],
    },
    response: {
        201: {
            description: 'Contribuição registrada com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string', nullable: true },
                value: { type: 'number' },
                date: { type: 'string', format: 'date-time' },
                type: { type: 'string', enum: ['OFERTA', 'DIZIMO', 'OUTRO'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                branchId: { type: 'string' },
            },
        },
    },
};
