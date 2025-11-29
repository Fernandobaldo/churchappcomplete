import { prisma } from '../lib/prisma';
export class FinanceService {
    async getByBranch(branchId) {
        return prisma.transaction.findMany({
            where: { branchId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getByBranchWithSummary(branchId) {
        const transactions = await this.getByBranch(branchId);
        // Calcula resumo
        const entries = transactions
            .filter(t => t.type === 'ENTRY')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const exits = transactions
            .filter(t => t.type === 'EXIT')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const total = entries - exits;
        return {
            transactions,
            summary: {
                total,
                entries,
                exits
            }
        };
    }
    async create(data) {
        return prisma.transaction.create({
            data: {
                title: data.title,
                amount: data.amount,
                type: data.type,
                category: data.category,
                branchId: data.branchId
            }
        });
    }
}
