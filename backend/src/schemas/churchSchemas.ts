export const createChurchSchema = {
    summary: 'Criar uma nova igreja principal',
    description: 'Cria uma igreja principal, que pode ter filiais associadas.',
    tags: ['Igrejas'],
    body: {
        type: 'object',
        properties: {
            name: { type: 'string'},
            logoUrl: { type: 'string' },
        },
        required: ['name'],
    },
    response: {
        201: {
            description: 'Igreja criada com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string'},
                name: { type: 'string' },
                logoUrl: { type: 'string' },
            },
        },
    },
};
