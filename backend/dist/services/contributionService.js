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
    async getActiveCount(branchId) {
        return prisma.contribution.count({
            where: {
                branchId,
                isActive: true,
            },
        });
    }
}
