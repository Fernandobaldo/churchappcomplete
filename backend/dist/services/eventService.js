import { prisma } from '../lib/prisma';
export class EventService {
    async getAll(branchId) {
        return await prisma.event.findMany({
            where: { branchId },
            orderBy: { startDate: 'asc' },
        });
    }
    async getById(id) {
        return await prisma.event.findUnique({
            where: { id },
            include: {
                branch: {
                    select: { name: true, churchId: true },
                },
            },
        });
    }
    async create(data) {
        return await prisma.event.create({ data });
    }
    async update(id, data) {
        return await prisma.event.update({ where: { id }, data });
    }
}
