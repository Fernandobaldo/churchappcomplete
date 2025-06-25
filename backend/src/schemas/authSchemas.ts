export const loginSchema = {
    summary: 'Login de usuário',
    description: 'Permite que um usuário se autentique e receba um token JWT.',
    tags: ['Auth'],
    body: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
        },
        required: ['email', 'password'],
    },
    response: {
        200: {
            type: 'object',
            properties: {
                token: { type: 'string' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        branchId: { type: 'string' },
                    },
                },
            },
        },
    },
};

export const registerSchema = {
    summary: 'Registro de novo membro',
    description: 'Cria um novo membro dentro de uma filial existente.',
    tags: ['Auth'],
    body: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            branchId: { type: 'string' },
            role: { type: 'string' },
        },
        required: ['name', 'email', 'password', 'branchId', 'role'],
    },
    response: {
        201: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                branchId: { type: 'string' },
            },
        },
    },
};
