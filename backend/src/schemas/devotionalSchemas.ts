import { z } from 'zod'

// Schema Zod para validação
export const createDevotionalBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório'),
    passage: z.string().min(1, 'Passagem bíblica obrigatória'),
    content: z.string().optional(),
})

// Schema Fastify para documentação Swagger
export const createDevotionalSchema = {
    summary: 'Criar um devocional',
    tags: ['Devocionais'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            passage: { type: 'string' },
            content: { type: 'string' },
        },
        required: ['title', 'passage'],
    },
    response: {
        201: {
            description: 'Devocional criado com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                passage: { type: 'string' },
                content: { type: 'string', nullable: true },
                authorId: { type: 'string' },
                branchId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                date: { type: 'string', format: 'date-time' },
            },
        },
    },
};
