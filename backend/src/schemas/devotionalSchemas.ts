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
            },
        },
    },
};
