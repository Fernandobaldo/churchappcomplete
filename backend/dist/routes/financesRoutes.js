import { FinanceController } from '../controllers/financeController';
import { checkPermission } from '../middlewares/checkPermission';
import { checkRole } from '../middlewares/checkRole';
import { checkBranchId } from '../middlewares/checkBranchId';
import { authenticate } from '../middlewares/authenticate';
export async function financesRoutes(app) {
    const controller = new FinanceController();
    app.get('/', {
        preHandler: [authenticate],
        schema: {
            description: 'Lista transações financeiras com resumo (total, entradas, saídas). Filtros opcionais: startDate, endDate, category, type, search',
            tags: ['Finanças'],
            summary: 'Listar transações e resumo financeiro',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    category: { type: 'string' },
                    type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
                    search: { type: 'string' },
                },
            },
            response: {
                200: {
                    description: 'Transações e resumo financeiro',
                    type: 'object',
                    properties: {
                        transactions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' },
                                    amount: { type: 'number' },
                                    type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
                                    category: { type: 'string', nullable: true },
                                    entryType: { type: 'string', enum: ['OFERTA', 'DIZIMO', 'CONTRIBUICAO'], nullable: true },
                                    exitType: { type: 'string', enum: ['ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'OUTROS'], nullable: true },
                                    exitTypeOther: { type: 'string', nullable: true },
                                    contributionId: { type: 'string', nullable: true },
                                    createdBy: { type: 'string', nullable: true },
                                    branchId: { type: 'string' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    updatedAt: { type: 'string', format: 'date-time' },
                                    CreatedByUser: {
                                        type: 'object',
                                        nullable: true,
                                        properties: {
                                            id: { type: 'string' },
                                            name: { type: 'string' },
                                            email: { type: 'string' },
                                        },
                                    },
                                    Contribution: {
                                        type: 'object',
                                        nullable: true,
                                        properties: {
                                            id: { type: 'string' },
                                            title: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        summary: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                entries: { type: 'number' },
                                exits: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, controller.getAll.bind(controller));
    app.get('/:id', {
        preHandler: [authenticate],
        schema: {
            description: 'Busca uma transação específica por ID',
            tags: ['Finanças'],
            summary: 'Obter transação por ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, controller.getById.bind(controller));
    app.post('/', {
        preHandler: [
            authenticate,
            checkBranchId(),
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['finances_manage']),
        ],
        // Schema removido - validação feita no controller com Zod
        // Isso permite que o controller retorne o formato de erro correto
    }, controller.create.bind(controller));
    app.put('/:id', {
        preHandler: [
            authenticate,
            checkBranchId(),
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['finances_manage']),
        ],
        schema: {
            description: 'Atualiza uma transação existente',
            tags: ['Finanças'],
            summary: 'Atualizar transação',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, controller.update.bind(controller));
    app.delete('/:id', {
        preHandler: [
            authenticate,
            checkBranchId(),
            checkRole(['ADMINGERAL', 'ADMINFILIAL', 'COORDINATOR']),
            checkPermission(['finances_manage']),
        ],
        schema: {
            description: 'Exclui uma transação',
            tags: ['Finanças'],
            summary: 'Excluir transação',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, controller.delete.bind(controller));
}
