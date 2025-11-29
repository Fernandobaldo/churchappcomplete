import { authenticate } from '../middlewares/authenticate';
import { createInviteLinkController, getInviteLinksByBranchController, deactivateInviteLinkController, getQRCodeController, downloadPDFController, getInviteLinkInfoController, } from '../controllers/inviteLinkController';
export async function inviteLinkRoutes(app) {
    // Rotas autenticadas
    app.post('/invite-links', {
        preHandler: [authenticate],
        schema: {
            description: 'Cria um novo link de convite para registro de membros',
            tags: ['Links de Convite'],
            summary: 'Criar link de convite',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['branchId'],
                properties: {
                    branchId: {
                        type: 'string',
                        description: 'ID da filial para a qual o link será criado',
                    },
                    maxUses: {
                        type: 'number',
                        nullable: true,
                        description: 'Número máximo de usos (null = ilimitado)',
                    },
                    expiresAt: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        description: 'Data de expiração do link (ISO 8601)',
                    },
                },
            },
            response: {
                201: {
                    description: 'Link de convite criado com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        token: { type: 'string' },
                        branchId: { type: 'string' },
                        createdBy: { type: 'string' },
                        maxUses: { type: ['number', 'null'] },
                        currentUses: { type: 'number' },
                        expiresAt: { type: ['string', 'null'] },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                    additionalProperties: true, // Permite campos adicionais como Branch
                },
                400: {
                    description: 'Dados inválidos',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                403: {
                    description: 'Sem permissão ou limite atingido',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                        code: { type: 'string' },
                    },
                    additionalProperties: true,
                },
            },
        },
    }, createInviteLinkController);
    app.get('/invite-links/branch/:branchId', {
        preHandler: [authenticate],
        schema: {
            description: 'Lista todos os links de convite de uma filial',
            tags: ['Links de Convite'],
            summary: 'Listar links de convite',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    branchId: {
                        type: 'string',
                        description: 'ID da filial',
                    },
                },
            },
            response: {
                200: {
                    description: 'Lista de links de convite',
                    type: 'array',
                },
            },
        },
    }, getInviteLinksByBranchController);
    app.patch('/invite-links/:id/deactivate', {
        preHandler: [authenticate],
        schema: {
            description: 'Desativa um link de convite',
            tags: ['Links de Convite'],
            summary: 'Desativar link de convite',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID do link de convite',
                    },
                },
            },
            response: {
                200: {
                    description: 'Link desativado com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        token: { type: 'string' },
                        branchId: { type: 'string' },
                        createdBy: { type: 'string' },
                        maxUses: { type: ['number', 'null'] },
                        currentUses: { type: 'number' },
                        expiresAt: { type: ['string', 'null'] },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                    additionalProperties: true,
                },
            },
        },
    }, deactivateInviteLinkController);
    // Rotas públicas para QR code e PDF
    app.get('/invite-links/:token/qrcode', {
        schema: {
            description: 'Retorna o QR code do link de convite',
            tags: ['Links de Convite'],
            summary: 'Obter QR code',
            params: {
                type: 'object',
                properties: {
                    token: {
                        type: 'string',
                        description: 'Token do link de convite',
                    },
                },
            },
            response: {
                200: {
                    description: 'Imagem PNG do QR code',
                    type: 'string',
                    format: 'binary',
                },
                404: {
                    description: 'Link não encontrado',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, getQRCodeController);
    app.get('/invite-links/:token/pdf', {
        schema: {
            description: 'Gera e retorna PDF com QR code do link de convite',
            tags: ['Links de Convite'],
            summary: 'Download PDF',
            params: {
                type: 'object',
                properties: {
                    token: {
                        type: 'string',
                        description: 'Token do link de convite',
                    },
                },
            },
            response: {
                200: {
                    description: 'PDF do link de convite',
                    type: 'string',
                    format: 'binary',
                },
                404: {
                    description: 'Link não encontrado',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, downloadPDFController);
    // Rota pública para obter informações do link (validação antes do registro)
    app.get('/invite-links/:token/info', {
        schema: {
            description: 'Retorna informações públicas do link de convite',
            tags: ['Links de Convite'],
            summary: 'Obter informações do link',
            params: {
                type: 'object',
                properties: {
                    token: {
                        type: 'string',
                        description: 'Token do link de convite',
                    },
                },
            },
            response: {
                200: {
                    description: 'Informações do link',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        branchName: { type: 'string' },
                        churchName: { type: 'string' },
                        expiresAt: { type: ['string', 'null'] },
                        maxUses: { type: ['number', 'null'] },
                        currentUses: { type: 'number' },
                        isActive: { type: 'boolean' },
                    },
                    additionalProperties: true,
                },
                404: {
                    description: 'Link não encontrado',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, getInviteLinkInfoController);
}
