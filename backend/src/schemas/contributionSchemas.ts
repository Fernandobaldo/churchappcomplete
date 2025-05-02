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
                value: { type: 'number' },
            },
        },
    },
};
