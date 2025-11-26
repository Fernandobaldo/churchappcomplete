import { prisma } from '../lib/prisma';
export class DevotionalService {
    async getAll(userId, branchId) {
        const devotionals = await prisma.devotional.findMany({
            where: { branchId },
            include: {
                author: true,
                likes: true,
            },
            orderBy: { date: 'desc' },
        });
        return devotionals.map(dev => ({
            ...dev,
            likesCount: dev.likes.length,
            liked: dev.likes.some(like => like.userId === userId),
        }));
    }
    async create(data) {
        return await prisma.devotional.create({ data });
    }
    async like(devotionalId, userId) {
        return await prisma.devotionalLike.create({
            data: { devotionalId, userId },
        });
    }
    async unlike(devotionalId, userId) {
        return await prisma.devotionalLike.deleteMany({
            where: { devotionalId, userId },
        });
    }
}
