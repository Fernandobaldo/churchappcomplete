import { prisma } from '../lib/prisma';
export class ContributionService {
    async getByBranch(branchId) {
        return prisma.contribution.findMany({
            where: { branchId },
            include: {
                PaymentMethods: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getById(id) {
        const contribution = await prisma.contribution.findUnique({
            where: { id },
            include: {
                Branch: {
                    select: {
                        id: true,
                        name: true,
                        churchId: true,
                    },
                },
                PaymentMethods: true,
            },
        });
        return contribution;
    }
    async create(data) {
        const contribution = await prisma.contribution.create({
            data: {
                title: data.title,
                description: data.description,
                goal: data.goal,
                endDate: data.endDate ? new Date(data.endDate) : null,
                isActive: data.isActive ?? true,
                branchId: data.branchId,
                PaymentMethods: data.paymentMethods
                    ? {
                        create: data.paymentMethods.map((pm) => ({
                            type: pm.type,
                            data: pm.data,
                        })),
                    }
                    : undefined,
            },
            include: {
                PaymentMethods: true,
            },
        });
        return contribution;
    }
    async toggleActive(id) {
        const contribution = await prisma.contribution.findUnique({
            where: { id },
        });
        if (!contribution) {
            throw new Error('Contribuição não encontrada');
        }
        return prisma.contribution.update({
            where: { id },
            data: {
                isActive: !contribution.isActive,
            },
            include: {
                PaymentMethods: true,
            },
        });
    }
    async update(id, data) {
        // Primeiro, verifica se a contribuição existe
        const existing = await prisma.contribution.findUnique({
            where: { id },
            include: { PaymentMethods: true },
        });
        if (!existing) {
            throw new Error('Contribuição não encontrada');
        }
        // Prepara os dados de atualização
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.goal !== undefined)
            updateData.goal = data.goal;
        if (data.endDate !== undefined) {
            updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        }
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        // Se paymentMethods foi fornecido, substitui todos os métodos de pagamento existentes
        if (data.paymentMethods !== undefined) {
            // Remove todos os métodos de pagamento existentes
            await prisma.contributionPaymentMethod.deleteMany({
                where: { contributionId: id },
            });
            // Cria os novos métodos de pagamento
            if (data.paymentMethods.length > 0) {
                updateData.PaymentMethods = {
                    create: data.paymentMethods.map((pm) => ({
                        type: pm.type,
                        data: pm.data,
                    })),
                };
            }
        }
        return prisma.contribution.update({
            where: { id },
            data: updateData,
            include: {
                PaymentMethods: true,
            },
        });
    }
    async getActiveCount(branchId) {
        return prisma.contribution.count({
            where: {
                branchId,
                isActive: true,
            },
        });
    }
    async delete(id) {
        // Primeiro, remove todos os métodos de pagamento associados
        await prisma.contributionPaymentMethod.deleteMany({
            where: { contributionId: id },
        });
        // Depois, remove a contribuição
        return prisma.contribution.delete({
            where: { id },
        });
    }
}
