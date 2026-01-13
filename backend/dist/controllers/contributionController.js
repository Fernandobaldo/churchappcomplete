import { ZodError } from 'zod';
import { ContributionService } from '../services/contributionService';
import { createContributionBodySchema, updateContributionBodySchema } from '../schemas/contributionSchemas';
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
            // Converte endDate YYYY-MM-DD para ISO 8601 se necessário
            let endDateValue = data.endDate;
            if (data.endDate && /^\d{4}-\d{2}-\d{2}$/.test(data.endDate)) {
                // Se for apenas data (YYYY-MM-DD), adiciona hora para ISO 8601
                endDateValue = `${data.endDate}T00:00:00.000Z`;
            }
            if (!user || !user.branchId) {
                return reply.code(400).send({ message: 'Usuário não vinculado a uma filial.' });
            }
            // Normaliza paymentMethods: remove hífen de agência e conta (CONTA_BR)
            const normalizedPaymentMethods = data.paymentMethods?.map((pm) => {
                if (pm.type === 'CONTA_BR' && pm.data) {
                    const normalizedData = { ...pm.data };
                    // Remove hífen de agência e conta
                    if (normalizedData.agencia) {
                        normalizedData.agencia = normalizedData.agencia.replace(/-/g, '');
                    }
                    if (normalizedData.conta) {
                        normalizedData.conta = normalizedData.conta.replace(/-/g, '');
                    }
                    return { ...pm, data: normalizedData };
                }
                return pm;
            });
            const created = await this.service.create({
                ...data,
                endDate: endDateValue,
                paymentMethods: normalizedPaymentMethods,
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
    async update(request, reply) {
        try {
            const data = updateContributionBodySchema.parse(request.body);
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
                return reply.status(403).send({ message: 'Você não tem permissão para alterar esta contribuição' });
            }
            // Converte endDate YYYY-MM-DD para ISO 8601 se necessário
            let endDateValue = data.endDate;
            if (data.endDate && /^\d{4}-\d{2}-\d{2}$/.test(data.endDate)) {
                // Se for apenas data (YYYY-MM-DD), adiciona hora para ISO 8601
                endDateValue = `${data.endDate}T00:00:00.000Z`;
            }
            // Normaliza paymentMethods: remove hífen de agência e conta (CONTA_BR)
            const normalizedPaymentMethods = data.paymentMethods?.map((pm) => {
                if (pm.type === 'CONTA_BR' && pm.data) {
                    const normalizedData = { ...pm.data };
                    // Remove hífen de agência e conta
                    if (normalizedData.agencia) {
                        normalizedData.agencia = normalizedData.agencia.replace(/-/g, '');
                    }
                    if (normalizedData.conta) {
                        normalizedData.conta = normalizedData.conta.replace(/-/g, '');
                    }
                    return { ...pm, data: normalizedData };
                }
                return pm;
            });
            const updated = await this.service.update(id, {
                ...data,
                endDate: endDateValue,
                paymentMethods: normalizedPaymentMethods,
            });
            return reply.send(updated);
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
            console.error('❌ Erro ao atualizar contribuição:', error);
            return reply.status(500).send({ error: 'Erro interno ao atualizar contribuição', details: error.message });
        }
    }
    async toggleActive(request, reply) {
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
                return reply.status(403).send({ message: 'Você não tem permissão para alterar esta contribuição' });
            }
            const updated = await this.service.toggleActive(id);
            return reply.send(updated);
        }
        catch (error) {
            console.error('❌ Erro ao alterar status da contribuição:', error);
            return reply.status(500).send({ error: 'Erro interno ao alterar status', details: error.message });
        }
    }
    async delete(request, reply) {
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
                return reply.status(403).send({ message: 'Você não tem permissão para excluir esta contribuição' });
            }
            await this.service.delete(id);
            return reply.send({ message: 'Contribuição excluída com sucesso' });
        }
        catch (error) {
            console.error('❌ Erro ao excluir contribuição:', error);
            return reply.status(500).send({ error: 'Erro interno ao excluir contribuição', details: error.message });
        }
    }
}
