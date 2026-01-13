import { prisma } from '../lib/prisma'

interface CreateNoticeInput {
  title: string
  message: string
  branchId: string
}

export class NoticeService {
  async getByBranch(branchId: string) {
    return prisma.notice.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getById(id: string) {
    return prisma.notice.findUnique({
      where: { id }
    })
  }

  async create(data: CreateNoticeInput) {
    return prisma.notice.create({
      data: {
        title: data.title,
        message: data.message,
        branchId: data.branchId,
        viewedBy: [] // Inicializa como array vazio
      }
    })
  }

  async markAsRead(id: string, userId: string) {
    const notice = await this.getById(id)
    
    if (!notice) {
      return null
    }

    // Se o usuário já está na lista, não adiciona novamente
    if (notice.viewedBy.includes(userId)) {
      return notice
    }

    // Adiciona o userId ao array viewedBy
    return prisma.notice.update({
      where: { id },
      data: {
        viewedBy: [...notice.viewedBy, userId]
      }
    })
  }

  async delete(id: string) {
    return prisma.notice.delete({
      where: { id },
    })
  }
}

