import { prisma } from '../lib/prisma';
export class NoticeService {
    async getByBranch(branchId) {
        return prisma.notice.findMany({
            where: { branchId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getById(id) {
        return prisma.notice.findUnique({
            where: { id }
        });
    }
    async create(data) {
        return prisma.notice.create({
            data: {
                title: data.title,
                message: data.message,
                branchId: data.branchId,
                viewedBy: [] // Inicializa como array vazio
            }
        });
    }
    async markAsRead(id, userId) {
        const notice = await this.getById(id);
        if (!notice) {
            return null;
        }
        // Se o usuário já está na lista, não adiciona novamente
        if (notice.viewedBy.includes(userId)) {
            return notice;
        }
        // Adiciona o userId ao array viewedBy
        return prisma.notice.update({
            where: { id },
            data: {
                viewedBy: [...notice.viewedBy, userId]
            }
        });
    }
}
