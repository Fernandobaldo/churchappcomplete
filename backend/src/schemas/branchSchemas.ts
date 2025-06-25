export const createBranchSchema = {
    summary: 'Criar uma nova filial (branch)',
    tags: ['Filiais'],
    body: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            pastorName: { type: 'string' },
            churchId: { type: 'string' },
        },
        required: ['name', 'pastorName', 'churchId'],
    },
    response: {
        201: {
            description: 'Filial criada com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                pastorName: { type: 'string' },
                churchId: { type: 'string' },
            },
        },
    },
};
