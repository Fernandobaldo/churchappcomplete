import { ZodError } from 'zod';
import { ContributionService } from '../services/contributionService';
import { createContributionBodySchema } from '../schemas/contributionSchemas';
export class ContributionController {
    constructor() {
        this.service = new ContributionService();
    }
    async getAll(request, reply) {
        const user = request.user;
        if (!user?.branchId) {
            return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' });
        }
        const contributions = await this.service.getByBranch(user.branchId);
        return reply.send(contributions);
    }
    async getById(request, reply) {
        try {
            const { id } = request.params;
            const user = request.user;
            if (!user?.branchId) {
                return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' });
            }
            const contribution = await this.service.getById(id);
            if (!contribution) {
                return reply.status(404).send({ message: 'Contribuição não encontrada' });
            }
            // Verificar se a contribuição pertence à mesma filial do usuário
            if (contribution.branchId !== user.branchId) {
                return reply.status(403).send({ message: 'Você não tem permissão para visualizar esta contribuição' });
            }
            return reply.send(contribution);
        }
        catch (error) {
            console.error('❌ Erro ao buscar contribuição:', error);
            return reply.status(500).send({ error: 'Erro interno ao buscar contribuição', details: error.message });
        }
    }
    async create(request, reply) {
        try {
            const data = createContributionBodySchema.parse(request.body);
            const user = request.user;
            // branchId já foi validado pelo middleware checkBranchId
            // Converte data YYYY-MM-DD para ISO 8601 se necessário
            let dateValue = data.date;
            if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
                // Se for apenas data (YYYY-MM-DD), adiciona hora para ISO 8601
                dateValue = `${data.date}T00:00:00.000Z`;
            }
            const created = await this.service.create({
                ...data,
                date: dateValue,
                branchId: user.branchId
            });
            return reply.code(201).send(created);
        }
        catch (error) {
            // Erros de validação do Zod retornam 400 (Bad Request)
            if (error instanceof ZodError) {
                return reply.status(400).send({
                    error: 'Dados inválidos',
                    message: error.errors?.[0]?.message || 'Erro de validação',
                    details: error.errors
                });
            }
            // Outros erros retornam 500
            console.error('❌ Erro ao criar contribuição:', error);
            return reply.status(500).send({ error: 'Erro interno ao criar contribuição', details: error.message });
        }
    }
    async getTypes(_, reply) {
        return reply.send([
            { label: 'Dízimo', value: 'DIZIMO' },
            { label: 'Oferta', value: 'OFERTA' },
            { label: 'Outro', value: 'OUTRO' },
        ]);
    }
}
