import { prisma } from '../lib/prisma';
export class ContributionService {
    async getByBranch(branchId) {
        return prisma.contribution.findMany({
            where: { branchId },
            orderBy: { date: 'desc' }
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
            },
        });
        return contribution;
    }
    async create(data) {
        const contribution = await prisma.contribution.create({
            data: {
                title: data.title,
                description: data.description,
                value: data.value,
                date: new Date(data.date),
                type: data.type,
                branchId: data.branchId
            }
        });
        // Prisma já serializa enums como strings, mas garantimos que está presente
        return contribution;
    }
}
