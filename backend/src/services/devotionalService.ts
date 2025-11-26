import { prisma } from '../lib/prisma'

export class DevotionalService {
  async getAll(memberId: string | null, branchId: string) {
    const devotionals = await prisma.devotional.findMany({
      where: { branchId },
      include: {
        Member: true,
        DevotionalLike: true,
      },
      orderBy: { date: 'desc' },
    })

    return devotionals.map(dev => {
      const { Member, DevotionalLike, ...rest } = dev
      return {
        ...rest,
        author: Member,
        likes: DevotionalLike.length,
        liked: memberId ? DevotionalLike.some(like => like.userId === memberId) : false,
      }
    })
  }

  async getById(id: string, memberId: string | null) {
    const devotional = await prisma.devotional.findUnique({
      where: { id },
      include: {
        Member: true,
        DevotionalLike: true,
      },
    })

    if (!devotional) {
      return null
    }

    const { Member, DevotionalLike, ...rest } = devotional
    return {
      ...rest,
      author: Member,
      likes: DevotionalLike.length,
      liked: memberId ? DevotionalLike.some(like => like.userId === memberId) : false,
    }
  }

  async create(data: {
    title: string
    passage: string
    content?: string
    authorId: string
    branchId: string
  }) {
    return await prisma.devotional.create({ data })
  }

  async like(devotionalId: string, memberId: string) {
    return await prisma.devotionalLike.create({
      data: { devotionalId, userId: memberId },
    })
  }

  async unlike(devotionalId: string, memberId: string) {
    return await prisma.devotionalLike.deleteMany({
      where: { devotionalId, userId: memberId },
    })
  }

  async update(id: string, data: {
    title?: string
    passage?: string
    content?: string
  }) {
    return await prisma.devotional.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    // Primeiro deleta os likes associados
    await prisma.devotionalLike.deleteMany({
      where: { devotionalId: id },
    })
    
    // Depois deleta o devocional
    return await prisma.devotional.delete({
      where: { id },
    })
  }
}
