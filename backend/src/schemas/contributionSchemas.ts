import { z } from 'zod'

// Schema para payment methods
const paymentMethodSchema = z.object({
    type: z.enum(['PIX', 'CONTA_BR', 'IBAN'], {
        errorMap: () => ({ message: 'Tipo deve ser PIX, CONTA_BR ou IBAN' }),
    }),
    data: z.record(z.any()), // JSON com campos específicos por tipo
})

// Schema Zod para validação
export const createContributionBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório'),
    description: z.string().optional(),
    goal: z.number().positive('Meta deve ser positiva').optional(),
    endDate: z.string().refine(
        (val) => {
            if (!val) return true // Opcional
            // Aceita formato date (YYYY-MM-DD) ou date-time (ISO 8601)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/
            const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
            return dateRegex.test(val) || dateTimeRegex.test(val) || !isNaN(Date.parse(val))
        },
        { message: 'Data inválida. Use formato YYYY-MM-DD ou ISO 8601' }
    ).optional(),
    paymentMethods: z.array(paymentMethodSchema).optional(),
    isActive: z.boolean().optional().default(true),
})

// Schema Zod para atualização (mesmos campos, mas todos opcionais exceto title)
export const updateContributionBodySchema = z.object({
    title: z.string().min(1, 'Título obrigatório').optional(),
    description: z.string().optional(),
    goal: z.number().positive('Meta deve ser positiva').optional(),
    endDate: z.string().refine(
        (val) => {
            if (!val) return true // Opcional
            // Aceita formato date (YYYY-MM-DD) ou date-time (ISO 8601)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/
            const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
            return dateRegex.test(val) || dateTimeRegex.test(val) || !isNaN(Date.parse(val))
        },
        { message: 'Data inválida. Use formato YYYY-MM-DD ou ISO 8601' }
    ).optional(),
    paymentMethods: z.array(paymentMethodSchema).optional(),
    isActive: z.boolean().optional(),
})

// Schema Fastify para documentação Swagger
export const createContributionSchema = {
    summary: 'Registrar uma nova campanha de contribuição',
    tags: ['Contribuições'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            goal: { type: 'number' },
            endDate: { type: 'string' },
            paymentMethods: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['PIX', 'CONTA_BR', 'IBAN'] },
                        data: { type: 'object' },
                    },
                },
            },
            isActive: { type: 'boolean' },
        },
        required: ['title'],
    },
    response: {
        201: {
            description: 'Campanha de contribuição registrada com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string', nullable: true },
                goal: { type: 'number', nullable: true },
                endDate: { type: 'string', nullable: true },
                raised: { type: 'number', nullable: true },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                branchId: { type: 'string' },
                PaymentMethods: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            type: { type: 'string' },
                            data: { type: 'object' },
                        },
                    },
                },
            },
        },
    },
};

// Schema Fastify para atualização
export const updateContributionSchema = {
    summary: 'Atualizar uma campanha de contribuição',
    tags: ['Contribuições'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            goal: { type: 'number' },
            endDate: { type: 'string' },
            paymentMethods: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['PIX', 'CONTA_BR', 'IBAN'] },
                        data: { type: 'object' },
                    },
                },
            },
            isActive: { type: 'boolean' },
        },
    },
    response: {
        200: {
            description: 'Campanha de contribuição atualizada com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string', nullable: true },
                goal: { type: 'number', nullable: true },
                endDate: { type: 'string', nullable: true },
                raised: { type: 'number', nullable: true },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                branchId: { type: 'string' },
                PaymentMethods: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            type: { type: 'string' },
                            data: { type: 'object' },
                        },
                    },
                },
            },
        },
    },
};
