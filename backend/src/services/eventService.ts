import { prisma } from '../lib/prisma'

export class EventService {
async getAll(branchId: string) {
    return await prisma.event.findMany({
      where: { branchId },
      orderBy: { startDate: 'asc' },
    })
  }

  async getById(id: string) {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        Branch: {
          select: { name: true, churchId: true },
        },
      },
    })
  }

  async create(data: any) {
    return await prisma.event.create({ data })
  }

  async update(id: string, data: any) {
    return await prisma.event.update({ where: { id }, data })
  }
}
