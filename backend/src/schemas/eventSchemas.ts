export const createEventSchema = {
    summary: 'Criar um novo evento',
    tags: ['Eventos'],
    body: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            time: { type: 'string' },
            hasDonation: { type: 'boolean' },
            donationLink: { type: 'string' },
            donationReason: { type: 'string' },
        },
        required: ['title', 'startDate', 'endDate', 'location', 'time'],
    },
    response: {
        201: {
            description: 'Evento criado com sucesso',
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
            },
        },
    },
};
